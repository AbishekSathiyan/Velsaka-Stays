const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");

require("dotenv").config();

const connectDB = require("./config/db");
const hotelRoutes = require("./routes/hotelRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const authRoutes = require("./routes/authRoutes");
const bookingRoutes = require("./routes/bookingRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Security headers
app.use(helmet());

// CORS: local development + production frontend
const allowedOrigins = [
  "http://localhost:5173",
  "https://velsaka-stays.vercel.app",
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.warn(`CORS blocked origin: ${origin}`);
      return callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Request parsing
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

// Rate limiting
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: "draft-7",
    legacyHeaders: false,
  }),
);

// Health endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "VELSAKA STAYS API is running",
    timestamp: new Date().toISOString(),
  });
});

// Test endpoint
app.get("/api/test", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Main server routes are working",
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/hotels", hotelRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/bookings", bookingRoutes);

// VELSAKA STAYS API landing page
app.get("/", (req, res) => {
  res.status(200).send(`
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
          transition: background 0.2s;
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
          Our API provides the services used by the hotel booking application.
        </p>

        <div class="status">
          <span class="dot"></span>
          <div>
            <strong>API service is running</strong>
            <p style="font-size: 12px; margin-top: 5px;">
              Backend deployed successfully
            </p>
          </div>
        </div>

        <h2>API endpoints</h2>

        <div class="endpoints">
          <a class="endpoint" href="/api/health">
            <code>/api/health</code>
            <span class="method">GET ↗</span>
          </a>

          <a class="endpoint" href="/api/test">
            <code>/api/test</code>
            <span class="method">GET ↗</span>
          </a>

          <a class="endpoint" href="/api/hotels">
            <code>/api/hotels</code>
            <span class="method">GET ↗</span>
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

// JSON response for unknown API endpoints
app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err.message);

  if (res.headersSent) {
    return next(err);
  }

  res.status(err.status || 500).json({
    success: false,
    message:
      err.status && err.status < 500 ? err.message : "Internal server error",
  });
});

// Start server
async function startServer() {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is missing from environment variables");
    }

    await connectDB();

    app.listen(PORT, () => {
      console.log(`VELSAKA STAYS API running on port ${PORT}`);
      console.log(`Health: http://localhost:${PORT}/api/health`);
      console.log(`Auth: http://localhost:${PORT}/api/auth`);
      console.log(`Allowed frontend origins: ${allowedOrigins.join(", ")}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();
