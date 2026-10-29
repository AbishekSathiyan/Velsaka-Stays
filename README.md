# VELSAKA STAYS

A full-stack hotel booking platform built with the MERN stack, featuring hotel discovery, user authentication, booking management, and Razorpay payment integration.

## Features

- **Hotel Discovery:** Browse hotels, view details, and explore available properties.
- **User Authentication:** Register, log in, and manage your profile using JWT-based authentication with HTTP-only cookies.
- **Booking Management:** Create bookings and view your booking history.
- **Online Payments:** Razorpay order creation, payment verification, and booking confirmation.
- **Responsive UI:** React-based frontend designed for desktop and mobile.
- **REST API:** Express.js backend with MongoDB persistence.
- **Security:** Password hashing, authentication middleware, CORS configuration, and request validation.

## Tech Stack

### Frontend
- React
- Vite
- JavaScript
- Axios
- CSS / Tailwind CSS, as configured in the project

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- bcrypt
- Razorpay
- Cookie Parser

## Project Structure

```text
Velsaka-Stays/
├── client/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── pages/
│   │   └── ...
│   ├── package.json
│   └── .env
│
├── server/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   └── index.js
│   ├── package.json
│   └── .env
│
└── README.md
```

## Getting Started

### Prerequisites

Install the following:

- Node.js and npm
- MongoDB Atlas account or a local MongoDB instance
- Razorpay account for payment integration

### 1. Clone the Repository

```bash
git clone https://github.com/AbishekSathiyan/Velsaka-Stays.git
cd Velsaka-Stays
```

If your actual GitHub repository uses a different URL, replace the clone URL accordingly.

### 2. Configure the Backend

```bash
cd server
npm install
```

Create a `.env` file inside the `server` directory:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret
RAZORPAY_KEY_ID=your_razorpay_test_key_id
RAZORPAY_KEY_SECRET=your_razorpay_test_key_secret
COOKIE_SAME_SITE=lax
```

Use your own credentials. Never commit `.env` files or expose secrets in public repositories.

Start the backend:

```bash
npm run dev
```

If your project does not define a `dev` script, check `server/package.json` and use the configured start command.

Backend base URL:

```text
http://localhost:5000
```

Health check:

```text
http://localhost:5000/api/health
```

### 3. Configure the Frontend

Open a new terminal:

```bash
cd client
npm install
```

Create a `.env` file inside the `client` directory:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm run dev
```

Vite will display the local frontend URL, usually:

```text
http://localhost:5173
```

## API Endpoints

Base URL: `/api`

| Method | Endpoint | Description | Authentication |
|---|---|---|---|
| GET | `/health` | Health check | No |
| GET | `/hotels` | List hotels | No |
| POST | `/auth/register` | Register a user | No |
| POST | `/auth/login` | Log in | No |
| GET | `/auth/me` | Get current user | Yes |
| PATCH | `/auth/me` | Update profile | Yes |
| POST | `/auth/logout` | Log out | No |
| POST | `/payments/create-order` | Create payment order and pending booking | Yes |
| POST | `/payments/verify` | Verify payment and confirm booking | Yes |
| GET | `/bookings/my` | Get the logged-in user's bookings | Yes |

Authentication uses the `vstays_token` HTTP-only cookie.

## Booking and Payment Flow

1. The user signs in.
2. The user selects a hotel and enters check-in, check-out, and guest details.
3. The frontend calls `POST /api/payments/create-order`.
4. The backend calculates the booking price and creates a Razorpay order.
5. A pending booking is saved in MongoDB.
6. Razorpay Checkout collects the payment.
7. The frontend submits the payment details to `POST /api/payments/verify`.
8. The backend verifies the signature and payment status.
9. The booking is marked as paid and confirmed after successful verification.

**Important:** Creating a payment order does not complete the payment. A booking should only be confirmed after successful server-side payment verification.

## Deployment

### Backend — Render

Configure the backend service with:

- Root directory: `server` (if deploying from the repository root)
- Build command: `npm install`
- Start command: use the production start script defined in `server/package.json`

Set the required MongoDB, JWT, and Razorpay environment variables in Render.

For cross-site cookies between Vercel and Render, configure production cookies with `Secure` and `SameSite=None`, and allow the exact frontend origin in CORS with credentials enabled.

### Frontend — Vercel

Configure the frontend project with:

- Root directory: `client` (if deploying from the repository root)
- Build command: `npm run build`
- Output directory: `dist`

Set the frontend environment variable:

```env
VITE_API_BASE_URL=https://velsaka-stays.onrender.com/api
```

Redeploy after changing environment variables.

### Live Demo

- **Frontend:** https://velsaka-stays.vercel.app
- **Backend:** 

## Testing

Test the backend locally:

```powershell
Invoke-RestMethod -Method GET -Uri "http://localhost:5000/api/health"
```

List hotels:

```powershell
Invoke-RestMethod -Method GET -Uri "http://localhost:5000/api/hotels"
```

After login, test booking retrieval:

```text
GET /api/bookings/my
```

Use Razorpay test mode before enabling live payments.

## Security Notes

- Keep MongoDB credentials, JWT secrets, and Razorpay secret keys private.
- Use HTTPS in production.
- Restrict CORS to trusted frontend origins.
- Validate all booking details on the server.
- Never trust client-submitted booking prices.
- Verify payment signatures and payment status on the backend.
- Do not store authentication tokens in browser local storage when using the HTTP-only cookie approach.

## Future Improvements

- Hotel search and filtering
- Hotel availability and room inventory management
- Booking cancellation and refund workflows
- Booking confirmation emails
- Admin dashboard for hotels and bookings
- Reviews and ratings
- Enhanced booking and payment history

## Author

**Abishek Sathiyan**

- Portfolio: https://abisheksathiyan-portfolio-front-end.vercel.app/
- GitHub: https://github.com/AbishekSathiyan
- LinkedIn: https://www.linkedin.com/in/abishek04/

---

Built with the MERN stack as part of the VELSAKA product ecosystem.
