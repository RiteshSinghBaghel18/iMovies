# iMovies - Cinema Ticket Booking Platform

iMovies is a full-stack movie ticketing application built with the MERN stack (MongoDB, Express, React, Node.js). It provides real-time seat selection via WebSockets, online booking workflows, digital ticket passes with QR codes, and an administrative dashboard to manage movies, cinema halls, and showtimes.

The user interface is designed around an Green (#76b900), deep black, and clean white color palette, with support for both dark and light display modes.

---

## Features

### Public and Customer Experience
- Split Catalog: Movies are organized into two distinct sections on the home catalog:
  - Now in Theatres: Active screenings currently running in cinema halls, with admin-added titles prioritized.
  - Upcoming Releases: Scheduled future releases with release dates and advance details.
- Movie Details with Ambient Video Trailers:
  - When opening a movie overview, the official trailer plays automatically in the background behind the title and poster.
  - If a trailer is not available, the interface smoothly falls back to the movie backdrop image.
- Cast and Crew Profiles: Detailed headshot photos, actor names, and character roles for featured cast members.
- Interactive Seating Selection:
  - Visual auditorium map divided into Balcony, Middle, and Lower seating tiers.
  - Real-time seat synchronization using Socket.io across multiple connected devices.
  - Ten-minute temporary seat holding timer to prevent double-booking.
- Digital Ticket Passes:
  - Generates a scannable digital ticket pass with booking confirmation details.
  - Includes a QR code and one-click print or save to PDF functionality.
- Customer Accounts and Watchlist:
  - Account registration with email verification codes.
  - Personal booking history and personal watchlist management.

### Administration Portal
- Real-time platform analytics including total revenue, active shows, and platform reservations.
- Movie Catalog Management: Add custom titles or sync with the TMDB database.
- Theatre Management: Register cinema halls with customizable seating capacities and pricing tiers.
- Showtime Scheduling: Assign movies to specific auditoriums, dates, and times.
- Refund Management: Review and process Razorpay payment refunds with automatic inventory release.

---

## Architecture and Tech Stack

- Frontend:
  - React 18 with Vite
  - Tailwind CSS with NVIDIA Green theme tokens
  - Lucide React iconography
  - Socket.io Client for real-time WebSocket communication
- Backend:
  - Node.js and Express.js REST API
  - MongoDB with Mongoose ODM
  - Socket.io for WebSocket room events
  - JSON Web Tokens (JWT) for authentication
  - Nodemailer and Brevo for transactional email delivery
  - Node-cron for background seat hold expiration cleanup

---

## Getting Started

### Prerequisites
- Node.js version 18 or higher
- MongoDB instance running locally or a MongoDB Atlas connection URI

### Backend Setup
1. Open a terminal in the `server` directory:
   ```bash
   cd server
   npm install
   ```
2. Configure your environment variables by creating a `.env` file based on `.env.example`:
   ```
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/imovies
   JWT_SECRET=your_jwt_secret_here
   CLIENT_URL=http://localhost:5173
   TMDB_API_KEY=your_tmdb_api_key
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   BREVO_API_KEY=your_brevo_api_key
   SENDER_EMAIL=your_verified_sender_email@domain.com
   SENDER_NAME=iMovies
   ```
3. Start the backend service:
   ```bash
   node server.js
   ```

### Frontend Setup
1. Open a terminal in the `client` directory:
   ```bash
   cd client
   npm install
   ```
2. Create a `.env` file in the `client` directory:
   ```
   VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
## Deployment link
`i-movies-kappa.vercel.app`

---

