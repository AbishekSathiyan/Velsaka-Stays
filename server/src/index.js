
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");

require("dotenv").config();

const connectDB = require("./config/db");

// ======================================
// ROUTE IMPORTS
// ======================================

const hotelRoutes = require("./routes/hotelRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const authRoutes = require("./routes/authRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const adminRoutes = require("./routes/adminRoutes");

// ======================================
// APP CONFIGURATION
// ======================================

const app = express();
const PORT = process.env.PORT || 5000;

app.set("trust proxy", 1);

// ======================================
// SECURITY
// ======================================

app.use(helmet());

// ======================================
// CORS CONFIGURATION
// ======================================

const allowedOrigins = [
  "http://localhost:5173",
  "https://velsaka-stays.vercel.app",
  process.env.CLIENT_URL,
].filter(Boolean);

function isAllowedOrigin(origin) {
  if (!origin) return true;

  if (allowedOrigins.includes(origin)) {
    return true;
  }

  try {
    const url = new URL(origin);

    return (
      url.protocol === "https:" &&
      (
        url.hostname === "velsaka-stays.vercel.app" ||
        (
          url.hostname.endsWith(".vercel.app") &&
          url.hostname.startsWith("velsaka-stays-")
        )
      )
    );
  } catch {
    return false;
  }
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }

      console.warn("CORS blocked origin:", origin);

      return callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ======================================
// REQUEST PARSING
// ======================================

app.use(express.json({ limit: "10kb" }));

app.use(
  express.urlencoded({
    extended: true,
    limit: "10kb",
  })
);

app.use(cookieParser());

// ======================================
// RATE LIMITING
// ======================================

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

app.use("/api", apiLimiter);

// ======================================
// HEALTH CHECK
// ======================================

app.get("/api/health", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "VELSAKA STAYS API is running",
    timestamp: new Date().toISOString(),
  });
});

// ======================================
// SERVER TEST
// ======================================

app.get("/api/test", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Main server routes are working",
  });
});

// ======================================
// API ROUTES
// IMPORTANT: REGISTER BEFORE 404
// ======================================

app.use("/api/auth", authRoutes);

app.use("/api/hotels", hotelRoutes);

app.use("/api/payments", paymentRoutes);

app.use("/api/bookings", bookingRoutes);

app.use("/api/admin", adminRoutes);

// ======================================
// ROOT API STATUS PAGE
// ======================================

app.get("/", (req, res) => {
  return res.status(200).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="theme-color" content="#183c2b" />
      <title>VELSAKA STAYS | API Status</title>

      <style>
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          min-height: 100vh;
          display: grid;
          place-items: center;
          padding: 24px;
          font-family: Arial, sans-serif;
          color: #183c2b;
          background: #f5f7f3;
        }

        .container {
          width: 100%;
          max-width: 680px;
          padding: 40px;
          background: white;
          border: 1px solid #e1e8e0;
          border-radius: 24px;
          box-shadow: 0 20px 60px rgba(24, 60, 43, 0.08);
        }

        .brand {
          font-size: 12px;
          letter-spacing: 5px;
          font-weight: bold;
          color: #a2844c;
        }

        h1 {
          margin-top: 18px;
          font-size: clamp(30px, 6vw, 44px);
          letter-spacing: -1.5px;
        }

        .description {
          margin-top: 14px;
          color: #647067;
          line-height: 1.7;
        }

        .status {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 28px;
          padding: 16px;
          border-radius: 14px;
          background: #edf8ef;
          color: #216738;
        }

        .dot {
          width: 10px;
          height: 10px;
          flex-shrink: 0;
          border-radius: 50%;
          background: #299b4a;
        }

        h2 {
          margin-top: 32px;
          margin-bottom: 14px;
          font-size: 17px;
        }

        .endpoints {
          display: grid;
          gap: 10px;
        }

        .endpoint {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 14px;
          border: 1px solid #e8ece8;
          border-radius: 12px;
          text-decoration: none;
          color: #183c2b;
        }

        .endpoint:hover {
          background: #f5f8f4;
        }

        .method {
          flex-shrink: 0;
          font-size: 11px;
          font-weight: bold;
          color: #8a7040;
        }

        code {
          font-size: 12px;
          overflow-wrap: anywhere;
        }

        footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #edf0ed;
          font-size: 12px;
          color: #7b847d;
          line-height: 1.7;
        }

        @media (max-width: 480px) {
          .container {
            padding: 25px;
          }
        }
      </style>
    </head>

    <body>
      <main class="container">
        <p class="brand">VELSAKA STAYS</p>

        <h1>Stay connected.</h1>

        <p class="description">
          Welcome to the VELSAKA STAYS backend service.
          Our API provides services for the hotel booking application.
        </p>

        <div class="status">
          <span class="dot"></span>
          <div>
            <strong>API service is running</strong>
            <p style="font-size: 12px; margin-top: 5px;">
              Backend service is online
            </p>
          </div>
        </div>

        <h2>API endpoints</h2>

        <div class="endpoints">
          <a class="endpoint" href="/api/health">
            <code>/api/health</code>
            <span class="method">GET</span>
          </a>

          <a class="endpoint" href="/api/test">
            <code>/api/test</code>
            <span class="method">GET</span>
          </a>

          <a class="endpoint" href="/api/hotels">
            <code>/api/hotels</code>
            <span class="method">GET</span>
          </a>
        </div>

        <footer>
          VELSAKA STAYS · Hotel Booking Platform<br />
          Powered by Node.js, Express and MongoDB.
        </footer>
      </main>
    </body>
    </html>
  `);
});

// ======================================
// SINGLE 404 HANDLER
// MUST BE AFTER ALL ROUTES
// ======================================

app.use("/api", (req, res) => {
  return res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// ======================================
// GLOBAL ERROR HANDLER
// ======================================

app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);

  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.status || 500;

  return res.status(statusCode).json({
    success: false,
    message:
      statusCode < 500
        ? err.message
        : "Internal server error",
  });
});

// ======================================
// START SERVER
// ======================================

async function startServer() {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log("----------------------------------");
      console.log("VELSAKA STAYS BACKEND STARTED");
      console.log("----------------------------------");

      console.log(`Port: ${PORT}`);
      console.log(`Health: http://localhost:${PORT}/api/health`);
      console.log(`Test: http://localhost:${PORT}/api/test`);

      console.log("Auth:     /api/auth");
      console.log("Hotels:   /api/hotels");
      console.log("Payments: /api/payments");
      console.log("Bookings: /api/bookings");
      console.log("Admin:    /api/admin");

      console.log("----------------------------------");
    });
  } catch (error) {
    console.error("FAILED TO START SERVER:", error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
