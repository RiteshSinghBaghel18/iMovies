# iMovies — Modern Cinema & Ticket Booking Platform

A full-stack cinema booking application built on the MERN stack. Features real-time seat reservation with Socket.io, Razorpay payment processing, automated email confirmations, dynamic TMDB market syncing with original trailers, and smart showtime scheduling.

---

## Highlights & Features

- **Live TMDB Market Integration**: Automatically fetches and syncs currently playing, trending, and upcoming releases complete with genuine trailer embeds and poster artwork.
- **Smart Showtime Expiration**: Past time slots for the current day (e.g., a 10:30 AM show when it is 1:00 PM) are automatically closed and disabled, preventing invalid seat reservations.
- **Multi-Theatre Booking Flow**: Browse all available cinemas with transparent pricing across Balcony, Middle, and Lower tiers.
- **Interactive Real-Time Seating Map**: Visual seat grid powered by Socket.io for live updates. Seats are locked with a 10-minute hold timer to prevent double booking.
- **Advanced Movie Filtering**: Public `GET /api/movie` endpoint with flexible query filtering (`?genre=&language=&search=`) paired with a debounced UI search bar.
- **Razorpay Payment Gateway**: Seamless test-mode checkout with HMAC SHA256 server-side signature verification.
- **Digital E-Tickets & Email Delivery**: Instant booking confirmations sent via Nodemailer with printable ticket details.
- **Admin Management Suite**: KPI analytics dashboard, theatre seat configuration designer, movie catalog management, and show scheduling.

---

## Tech Stack

- **Frontend**: React 18, Vite, React Router v6, Tailwind CSS, Day.js, Axios, React Toastify, Socket.io Client
- **Backend**: Node.js, Express.js, MongoDB with Mongoose ODM, Socket.io
- **Payments**: Razorpay SDK
- **Mailing**: Nodemailer (Gmail / SMTP / Brevo fallback)
- **Background Jobs**: Node-cron (for 10-minute expired seat lock cleanup and 24h movie show reminders)

---

## Project Structure

```
iMovies/
├── client/                     # Vite + React Frontend
│   ├── src/
│   │   ├── components/         # Header, Footer, MovieCard, SearchBar, Loader
│   │   ├── pages/              # Landing, Home, MovieDetails, MovieShows, SeatSlug, Bookings, Admin
│   │   ├── utils/              # api.js, showTimeHelper.js, Auth guards, ThemeContext
│   │   ├── App.jsx             # Route definitions & lazy loading
│   │   └── main.jsx
│   ├── vercel.json             # SPA routing rewrite for Vercel
│   └── package.json
│
└── server/                     # Node.js + Express Backend
    ├── controllers/            # auth, movie, theatre, show, booking, payment
    ├── middlewares/            # JWT authentication middleware (fetchUser)
    ├── models/                 # User, Admin, Movie, Theatre, Show, Booking, Review
    ├── routes/                 # Express API routes
    ├── services/               # TMDB market sync service
    ├── utils/                  # showTimeHelper, showGenerator, mailer, cron jobs
    ├── server.js               # Entry point, Socket.io setup, CORS config
    └── package.json
```

---

## Getting Started

### Prerequisites

- **Node.js** (v18 or higher recommended)
- **MongoDB** running locally (`mongodb://localhost:27017/imovies`) or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster URI

### 1. Environment Setup

Create or verify `server/.env`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/imovies
JWT_SECRET=imovies_super_secret
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
RAZORPAY_KEY_ID=rzp_test_Tqs4
RAZORPAY_KEY_SECRET=lSiHyQJ
TMDB_API_KEY=your_tmdb_api_key_optional
```

Create or verify `client/.env`:

```env
VITE_API_URL=http://localhost:5000
VITE_RAZORPAY_KEY_ID=rzp_test_
```

### 2. Install Dependencies

Open your terminal:

```bash
# Backend dependencies
cd server
npm install

# Frontend dependencies
cd ../client
npm install
```

### 3. Run Locally

In one terminal, start the Express API:
```bash
cd server
npm run dev
# or: node server.js
```

In a second terminal, launch the Vite dev server:
```bash
cd client
npm run dev
```

Visit **`http://localhost:5173`** in your browser.

---

## Seed Accounts for Testing

The backend automatically creates test credentials upon boot:

- **Regular User**:
  - Email: `example@ex.com`
  - Password: `example`
- **Admin**:
  - Email: `example@ex.com`
  - Password: `example`

---

## Key API Routes

### Movies (`/api/movie`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/movie` | Public (None) | List all movies. Supports query filters: `?genre=&language=&search=` |
| GET | `/api/movie/sections` | Public (None) | Curated sections (Trending, Now Playing, Top Rated, Upcoming) |
| GET | `/api/movie/:id` | Public (None) | Get detailed movie metadata & cast |
| POST | `/api/movie/add` | Admin (JWT) | Add a new movie record |
| PUT | `/api/movie/update/:id` | Admin (JWT) | Update movie details |
| DELETE | `/api/movie/delete/:id` | Admin (JWT) | Remove a movie from the catalog |

### Shows (`/api/shows`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/shows/movie/:movieId` | Public (None) | Fetch all upcoming shows grouped across theatres with `isExpired` flags |
| GET | `/api/shows/:showId` | Public (None) | Enriched show details, theatre pricing, and live seating layout |
| POST | `/api/shows/add` | Admin (JWT) | Schedule a new showtime slot |
| DELETE | `/api/shows/delete/:showId` | Admin (JWT) | Cancel and remove a showtime |

### Bookings & Payments (`/api/bookings` & `/api/payment`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/bookings/lock` | User (JWT) | Temporarily lock selected seats (guards against expired slots) |
| POST | `/api/payment/create-order` | User (JWT) | Initialize Razorpay payment order for reserved seats |
| POST | `/api/payment/verify` | User (JWT) | Verify payment signature and generate confirmed booking |
| GET | `/api/bookings/user` | User (JWT) | Retrieve user's personal booking history |
| POST | `/api/bookings/cancel` | User (JWT) | Cancel a reserved booking and release seats |

---

## Testing & Verification

Run the frontend production build:
```bash
cd client
npm run build
```

Run test suite on past showtime expiration and query filters:
```bash
cd server
node -e "
const { isShowExpired } = require('./utils/showTimeHelper');
const today = new Date().toISOString().split('T')[0];
console.log('Past slot expired:', isShowExpired(today, '10:30 AM'));
"
```

---
. Crafted with care for movie lovers and cinema operators.
