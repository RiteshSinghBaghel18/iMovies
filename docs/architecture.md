# iMovies Architecture and System Design

## 1. Architectural Overview

iMovies is engineered as a decoupled, full-stack web application implementing the **Model-View-Controller (MVC)** architectural pattern. 

- **Backend (API Service)**: Built with Node.js and Express.js, providing RESTful endpoints and real-time WebSocket communication via Socket.io.
- **Frontend (Client Application)**: Built with React 18, Vite, and Tailwind CSS, providing a dynamic Single Page Application (SPA).
- **Database (Persistence Layer)**: MongoDB document database managed via the Mongoose Object Data Modeling (ODM) library.
- **External Integrations**:
  - **TMDB (The Movie Database)**: Real-time movie synchronization for in-theatre and upcoming releases.
  - **Razorpay**: Payment gateway order generation, signature verification, and refund management.
  - **Brevo (formerly Sendinblue) & Nodemailer**: Transactional email dispatch for verification, password resets, and ticket delivery.

```
                      +---------------------------------------+
                      |             Browser Client            |
                      |   React 18 SPA + Tailwind CSS Views   |
                      +-------------------+-------------------+
                                          |
                        HTTP / REST APIs  |  WebSockets (Socket.io)
                                          v
                      +-------------------+-------------------+
                      |          Express.js Server            |
                      |   CORS / Auth Middleware / Routing    |
                      +-------------------+-------------------+
                                          |
                      +-------------------+-------------------+
                      |             Controllers               |
                      |  Business Logic & Validation Layer    |
                      +---------+-------------------+---------+
                                |                   |
                 Mongoose ODM   |                   |  Third-Party Services
                                v                   v
        +-----------------------+-------+   +-------+-----------------------+
        |         MongoDB Layer         |   | Razorpay / TMDB / Brevo APIs  |
        |  Collections: Shows, Movies,  |   |  - Payment verification       |
        |  Users, Bookings, Theatres    |   |  - Live catalog synchronization|
        +-------------------------------+   |  - Transactional email dispatch|
                                            +-------------------------------+
```

---

## 2. Model Layer (Data & Persistence)

The Model layer defines the schemas, relationship constraints, indexes, and data validation rules using Mongoose.

### Primary Entities

| Model | Schema File | Primary Responsibilities |
|---|---|---|
| **User** | `server/models/userModel.js` | Stores customer credentials (bcrypt hashed), profile details, account verification tokens, OTPs, and password reset tokens. |
| **Admin** | `server/models/adminModel.js` | Dedicated administrator accounts for theatre, movie, and showtime management. |
| **Movie** | `server/models/movieModel.js` | Stores metadata (title, duration, genre, backdrop, poster, rating, cast array, YouTube trailer URL, and release status). Differentiates between admin-added custom movies and TMDB synced records. |
| **Theatre** | `server/models/theatreModel.js` | Defines cinema hall locations, base pricing per tier, and layout dimensions for Balcony, Middle, and Lower sections. |
| **Show** | `server/models/showModel.js` | Represents a specific screening instance (movie, theatre, date, time). Contains the real-time seat inventory dictionary (`tickets`). |
| **Booking** | `server/models/bookingModel.js` | Audit record of customer orders. Stores seat lists, payment IDs, Razorpay signatures, refund records, and immutable snapshots of the movie and theatre details. |
| **Review** | `server/models/reviewModel.js` | Star ratings and text reviews linked to individual movie IDs and customer emails. |
| **Favorite** | `server/models/favoriteModel.js` | Compound indexed user watchlist tracking bookmarked movies. |

### Concurrency and Real-Time Seat Modeling
In `showModel.js`, the `tickets` field is stored as an object dictionary where keys represent seat identifiers (e.g., `B-A1`, `M-C4`):
```javascript
tickets: {
  type: mongoose.Schema.Types.Mixed,
  required: [true, "Tickets structure is required"]
}
```
This enables atomic lookups and in-place state transitions (`available` -> `locked` -> `booked`) without lock-table contention or complex database joins.

---

## 3. Controller Layer (Business Logic)

Controllers encapsulate business rules, request validation, database mutations, and third-party API orchestration.

| Controller | Source File | Core Responsibilities |
|---|---|---|
| `authController` | `server/controllers/authController.js` | Handles user registration, bcrypt password hashing, email verification OTP checking, JWT issuance, and password recovery. |
| `movieController` | `server/controllers/movieController.js` | Manages movie querying, genre filters, custom title addition, and categorized separation into Now in Theatres vs Upcoming releases. |
| `theatreController` | `server/controllers/theatreController.js` | Handles cinema hall registration, tier capacity calculation, and auditorium retrieval. |
| `showController` | `server/controllers/showController.js` | Automates seat grid ticket generation from theatre geometry, handles showtime scheduling, and filters out expired shows. |
| `bookingController` | `server/controllers/bookingController.js` | Manages 10-minute temporary seat holds, manual seat unlocks, booking confirmations, and customer booking history. |
| `paymentController` | `server/controllers/paymentController.js` | Integrates with Razorpay SDK: order creation, cryptographic HMAC SHA256 signature verification, and partial/full refund execution. |
| `adminController` | `server/controllers/adminController.js` | Collects platform metrics (total bookings, revenue, active theatres, capacity rates) and manages administrative accounts. |
| `reviewController` | `server/controllers/reviewController.js` | Manages creation and listing of movie ratings and user comments. |
| `favoriteController` | `server/controllers/favoriteController.js` | Adds, removes, and lists bookmarked titles per customer. |
| `emailController` | `server/controllers/emailController.js` | Diagnostic and trigger endpoints for transactional notifications via Brevo API. |

---

## 4. View Layer (Client-Side Interface & API Views)

In this decoupled architecture, the View layer consists of two components:
1. **API Response Views**: Standardized JSON response payloads generated by the backend controllers.
2. **Client Views**: Component trees rendered by React 18, styled with Tailwind CSS, utilizing NVIDIA Green (`#76b900`) branding tokens.

### Standardized API JSON Formats
All backend controllers return responses adhering to a uniform envelope:
```json
{
  "success": true,
  "message": "Operation completed successfully.",
  "data": { ... }
}
```
On operational failures or validation errors:
```json
{
  "success": false,
  "message": "Detailed human-readable error description.",
  "error": "OPTIONAL_ERROR_CODE"
}
```

### Client Route Hierarchy
The frontend view router is partitioned using route guards (`UserProtection` and `AdminProtection`):

- **Public & Authentication Views**:
  - `/landing` (`Landing.jsx`): Hero showcase, features banner, and call-to-action.
  - `/login` (`Login.jsx`): Role-aware credential authentication.
  - `/register` (`Register.jsx`): Account creation with validation feedback.
  - `/verify-email` (`VerifyEmail.jsx`): One-time verification token submission.
  - `/reset-password` (`ResetPassword.jsx`): Secure password recovery.
- **Customer Views**:
  - `/home` (`Home.jsx`): Catalog organized into Now in Theatres and Upcoming sections.
  - `/moviedetails/:movieId` (`MovieDetails.jsx`): Overview with ambient video trailer and cast headshots.
  - `/movieshows/:movieId` (`MovieShows.jsx`): Date selector and available screening schedules.
  - `/seatslug/:showId` (`SeatMap.jsx`): Real-time interactive seat grid with 10-minute hold countdown timer.
  - `/bookings` (`Bookings.jsx`): Customer ticket pass records and printable digital tickets.
  - `/favorite` (`FavoriteShows.jsx`): Personal user watchlist.
  - `/profile` (`Profile.jsx`): User profile and account preferences.
- **Admin Portal Views**:
  - `/admin` (`AdminDashboard.jsx`): Analytics overview, revenue charts, and operational controls.
  - `/admin/add-movie` (`AddMovie.jsx`): Film catalog addition interface.
  - `/admin/add-theatre` (`AddTheatre.jsx`): Hall setup with dynamic tier configuration.
  - `/admin/add-show` (`AddShow.jsx`): Showtime scheduling tool.
  - `/admin/bookings` (`AdminBookings.jsx`): Platform-wide order and refund auditing.

---

## 5. Request Lifecycle and Data Flow

```
[ Browser / React App ]
         |
         | 1. HTTP Request (e.g. POST /api/bookings/lock)
         v
[ Express Middlewares ]
  - cors()                  -> Dynamic origin validation (localhost / production domains)
  - express.json()          -> Parses incoming JSON payloads
  - fetchUser()             -> Validates JWT from 'Authorization' or 'auth-token' header
         |
         | 2. Authenticated user attached to req.user
         v
[ Route Dispatcher ]        -> Routes request to bookingRoutes.js -> bookingController.lockSeats
         |
         | 3. Execution of Business Logic & Sanity Checks
         v
[ Controller Logic ]
  - Validate showId & seats array
  - Query Show model via Mongoose
  - Verify showtime is in the future
  - Check availability of requested seat IDs
         |
         | 4. Database Mutation
         v
[ MongoDB Database ]
  - Marks seats as 'locked' with lockExpiresAt timestamp
  - Commits updated document to 'shows' collection
         |
         | 5. Multi-channel Response
         +---------------------------------------+
         |                                       |
         v                                       v
[ HTTP Response (JSON) ]                [ Socket.io Server ]
Sends 200 OK with lock expiry           Broadcasts 'seatsUpdated'
to requesting client                    to room `show_${showId}`
         |                                       |
         v                                       v
[ Requesting Browser UI ]               [ Other Connected Browsers ]
Starts 10-minute hold countdown         Instantly displays seats as locked
Opens Payment Gateway Modal             by another customer
```

---

## 6. Real-Time WebSocket Architecture

The platform uses WebSockets (`socket.io` and `socket.io-client`) to maintain synchronized seating states across concurrent customers:

1. **Room Partitioning**: When a user navigates to `/seatslug/:showId`, the client emits `joinShow` with the target `showId`. The server joins the socket to a private room: `show_${showId}`.
2. **State Broadcasting**: When any user locks, unlocks, or completes payment for a seat, the backend emits `seatsUpdated` to the specific show room.
3. **Automated Conflict Resolution**: If user A has selected seat `B-A4` and user B successfully locks it first, user A's interface receives the socket event, deselects the seat, and displays an informative notification.
4. **TTL Expiration Cleanup**: A scheduled cron job (`utils/cleanupService.js`) runs every 30 seconds on the server, scanning for expired seat holds (`lockExpiresAt <= now`). Any expired holds are reset to `available` and broadcast to the room immediately.

---

## 7. Security and Authentication Strategy

- **Password Storage**: Passwords are salted and hashed using `bcryptjs` with 10 rounds of salt generation.
- **Stateless Tokens**: Authentication uses JSON Web Tokens (JWT) signed with a server secret key and transmitted via HTTP headers (`auth-token` or `Authorization: Bearer <token>`).
- **Route Protection**:
  - `fetchUser`: Verifies JWT validity and attaches user payload to `req.user`.
  - Admin verification: Endpoints requiring administrative privileges verify `req.user.role === 'admin'`.
- **Payment Verification**: Razorpay payment confirmations require cryptographic HMAC SHA256 validation comparing `razorpay_signature` against `razorpay_order_id + "|" + razorpay_payment_id` using the server secret key before any ticket is issued.
