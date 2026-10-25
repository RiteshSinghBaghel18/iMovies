# iMovies — Modern Cinema & Ticket Booking Platform

A full-stack cinema booking web application built on the **MERN** stack (MongoDB, Express.js, React.js, Node.js) with real-time **Socket.io** WebSocket seat synchronization, 10-minute temporary seat locking, printable QR digital passes, Razorpay test payment processing, automated cron services, and an executive administration suite.

Styled in a signature **NVIDIA Green (`#76b900`), Pitch Black, and Crisp White** cinema palette.

---

## Key Highlights & Features

### 1. Frontend (React 18 + Vite)
- **Code-Splitting & Lazy Loading**: All pages use `React.lazy` and `Suspense` for sub-second page loads.
- **Cinematic High-Tech Design**: Signature NVIDIA green (`#76b900`), pitch black (`#000000`), and clean white aesthetic with curved auditorium screens and responsive layout.
- **Real-Time Seat Picker (`/seatslug/:showId`)**:
  - Multi-tier seat map: **Balcony (VIP)**, **Middle (Premium)**, and **Lower (Standard)**.
  - Live WebSocket synchronization with **Socket.io** across concurrent browsers.
  - 10-minute temporary seat hold countdown with live progress alerts.
- **Digital Printable Passes & QR Tickets**: Instant modal with scannable QR codes, seat breakdowns, barcode styling, and print/PDF support.
- **Payment & Checkout Simulation**: Razorpay gateway checkout supporting Cards, UPI VPAs, and Net Banking with celebration confetti.
- **User Authentication & Email Verification**:
  - 6-digit OTP and direct email verification link dispatch via Brevo (Sendinblue).
  - Watchlist management, booking history, and one-click reservation cancellation.
- **Admin Management Portal (`/admin`)**:
  - Executive overview metrics: Total Revenue, Total Bookings, Movies, Theatres, Occupancy.
  - Movie catalog creator & TMDB live synchronizer (`/addmovie`).
  - Auditorium builder with seat pricing tiers (`/addtheatre`).
  - Showtime scheduler linking titles, auditoriums, dates, and times (`/addshow`).
  - Sub-admin access delegator (`/addadmin`).
  - Transaction ledger and refund management (`/admin/transactions`).

### 2. Backend (Node.js + Express.js)
- **RESTful MVC Architecture**: Structured separation into Controllers, Models, Routes, Middleware, and Services.
- **Dynamic CORS & Vercel Compatibility**: Handles cross-origin requests across local development and production domains.
- **Automatic Background Jobs**:
  - `node-cron` seat lock cleaner running every 30 seconds to release abandoned holds.
  - Automated showtime email reminder dispatcher via Nodemailer / Brevo.
  - Automated 6-hour TMDB movie catalog refresher.
- **WebSocket Gateway**: Dedicated show rooms (`show_<showId>`) for instant seat reservation, locking, and release broadcasts.

---

## Project Structure

```
iMovies/
├── client/                     # Frontend (React 18 + Vite + Tailwind CSS)
│   ├── src/
│   │   ├── components/         # Header, Footer, Loader, DigitalTicketModal, PaymentModal, AdminTransactions
│   │   ├── context/            # AuthContext, SocketContext
│   │   ├── hooks/              # useFetch custom hook
│   │   ├── pages/              # Landing, Home, MovieDetails, MovieShows, SeatMap, Bookings, Profile, AdminDashboard
│   │   ├── utils/              # Axios API instance with JWT interceptors, dateTime helpers
│   │   ├── App.jsx             # React Router configuration with lazy loading
│   │   └── main.jsx
│   ├── tailwind.config.js      # NVIDIA Green, Black & White Theme
│   └── package.json
│
└── server/                     # Backend (Node.js + Express.js REST API)
    ├── config/                 # Email and environment configuration
    ├── controllers/            # Auth, Movie, Theatre, Show, Booking, Payment, Review
    ├── middlewares/            # JWT authentication & admin protection
    ├── models/                 # User, Admin, Movie, Theatre, Show, Booking, Review
    ├── routes/                 # Express API routes
    ├── services/               # Brevo transactional email & TMDB market sync
    ├── utils/                  # Seat cleanup cron, reminder cron, mailer, seedData
    ├── server.js               # Entry point with HTTP + Socket.io server
    └── .env                    # MONGO_URI, PORT, JWT_SECRET, TMDB, RAZORPAY, BREVO
```

---

## Default Credentials (Pre-Seeded)

| Role | Email | Password | Access Level |
|---|---|---|---|
| **Movie Fan (User)** | `demo@imovies.com` | `user123` | Browsing, Booking, Watchlist, Reviews, Tickets |
| **Movie Fan (Test)** | `user@imovies.com` | `user1234` | Browsing, Booking, Watchlist, Reviews, Tickets |
| **Administrator** | `admin@imovies.com` | `admin1234` / `admin123` | Full Dashboard, Analytics, Movie/Theatre/Show CRUD, Transactions |

---

## Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [MongoDB](https://www.mongodb.com/) running locally on `mongodb://localhost:27017` (or MongoDB Atlas connection URI)

### 2. Backend Setup
```bash
cd server
npm install
node server.js
```
The server will initialize on port 5000, verify default admin credentials, and connect to MongoDB.

### 3. Frontend Setup
```bash
cd client
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.
