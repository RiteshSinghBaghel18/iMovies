## iMovies — Movie Ticket Booking Platform

> *Your ultimate destination for the latest blockbusters and timeless classics*

A full-stack, production-ready Movie Ticket Booking Web Application built with the **MERN stack** (MongoDB, Express, React, Node.js), featuring real-time seat locking via **Socket.io**, automated email reminders via **Nodemailer**, and a sleek dark cinema UI.

---

##  Project Structure

```
iMovies/
├── client/                         # Frontend (Vite + React 18)
│   ├── src/
│   │   ├── components/             # Header, Footer, Loader, MovieCard
│   │   ├── hooks/                  # useFetch (custom auth-aware hook)
│   │   ├── pages/                  # 16 fully implemented pages
│   │   │   ├── Landing.jsx         # Cinematic hero landing page
│   │   │   ├── Login.jsx           # User + Admin dual-tab login
│   │   │   ├── Register.jsx        # User + Admin registration
│   │   │   ├── Home.jsx            # Movie catalog with search & filters
│   │   │   ├── MovieDetails.jsx    # Movie info, cast, reviews, favorites
│   │   │   ├── MovieShows.jsx      # Show listings with 7-day date picker
│   │   │   ├── SeatSlug.jsx        # Real-time interactive seat map
│   │   │   ├── Bookings.jsx        # Digital ticket history
│   │   │   ├── FavoriteShows.jsx   # User watchlist
│   │   │   ├── Profile.jsx         # Account dashboard & stats
│   │   │   ├── Admin.jsx           # Admin KPI dashboard
│   │   │   ├── AddMovie.jsx        # Movie management (admin)
│   │   │   ├── AddTheatre.jsx      # Theatre setup with seat designer
│   │   │   ├── AddShow.jsx         # Show scheduling
│   │   │   ├── AddAdmin.jsx        # Sub-admin creation
│   │   │   └── AdminBookings.jsx   # All reservations overview
│   │   ├── utils/                  # api.js, UserProtection, AdminProtection
│   │   ├── App.jsx                 # Router with lazy loading + Suspense
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js              # Proxy: /api -> http://localhost:5000
│   ├── tailwind.config.js
│   └── index.html
│
└── server/                         # Backend (Node.js + Express)
    ├── controllers/                # 7 controller modules
    │   ├── authController.js       # JWT auth, stats aggregation
    │   ├── movieController.js      # Movie CRUD + search/filter
    │   ├── theatreController.js    # Theatre CRUD
    │   ├── showController.js       # Show CRUD + seat initialization
    │   ├── bookingController.js    # Seat lock, booking, cancellation
    │   ├── favoriteController.js   # Watchlist management
    │   └── reviewController.js     # Ratings & reviews
    ├── middlewares/
    │   └── fetchUser.js            # JWT verification middleware
    ├── models/                     # 8 Mongoose schemas
    │   ├── userModel.js
    │   ├── adminModel.js
    │   ├── movieModel.js
    │   ├── theatreModel.js
    │   ├── showModel.js
    │   ├── bookingModel.js
    │   ├── favoriteModel.js
    │   └── reviewModel.js
    ├── routes/                     # 7 Express route modules
    │   ├── authRoutes.js           # /api/auth
    │   ├── movieRoutes.js          # /api/movie
    │   ├── theatreRoutes.js        # /api/theatre
    │   ├── showRoutes.js           # /api/shows
    │   ├── bookingRoutes.js        # /api/bookings
    │   ├── favoriteRoutes.js       # /api/favorite
    │   └── reviewRoutes.js         # /api/review
    ├── utils/
    │   ├── mailer.js               # Nodemailer HTML email templates
    │   ├── cleanupService.js       # Cron: release locks every 1 min
    │   └── reminderService.js      # Cron: email reminders every 1 hr
    ├── server.js                   # Express entry point + Socket.io
    └── .env                        # Environment variables
```

---

## Quick Start

### Prerequisites

- **Node.js** v18+ → [Download](https://nodejs.org/)
- **MongoDB** → [Local install](https://www.mongodb.com/try/download/community) or [MongoDB Atlas](https://cloud.mongodb.com/) (free cloud)
- **Git** (optional)

### 1. Configure Environment

Edit `server/.env`:
```env
MONGO_URI=mongodb://localhost:27017/imovies   # or your Atlas URI
PORT=5000
JWT_SECRET=imovies_super_secret_jwt_key_2024
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password            # Google App Password
```

> **Gmail App Password**: Enable 2FA on your Google account → Security → App Passwords → Generate for "Mail"

### 2. Install Dependencies

```bash
# Install backend dependencies
cd iMovies/server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 3. Start the Application

Open **two terminal windows**:

**Terminal 1 — Backend:**
```bash
cd iMovies/server
npm run dev         # uses nodemon for hot-reload
```

**Terminal 2 — Frontend:**
```bash
cd iMovies/client
npm run dev         # Vite dev server at http://localhost:5173
```

### 4. Open in Browser

```
http://localhost:5173
```

---

##  Authentication

| Role | Register At | Login At | Redirects To |
|------|------------|----------|--------------|
| User | `/register` → User tab | `/login` → User tab | `/home` |
| Admin | `/register` → Admin tab | `/login` → Admin tab | `/admin` |

JWT tokens are stored in `localStorage` with key `imovies-token`.

---

## API Endpoints

### Auth — `/api/auth`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | ❌ | Register user |
| POST | `/login` | ❌ | Login user |
| POST | `/admin/register` | ❌ | Register admin |
| POST | `/admin/login` | ❌ | Login admin |
| GET | `/validate` | ✅ | Validate JWT token |
| GET | `/admin/stats` | ✅ | Platform analytics |

### Movies — `/api/movie`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | ❌ | Get all movies (filter: ?genre=&language=&search=) |
| GET | `/:id` | ❌ | Get movie by ID |
| POST | `/add` | ✅ | Add movie |
| PUT | `/update/:id` | ✅ | Update movie |
| DELETE | `/delete/:id` | ✅ | Delete movie |

### Theatres — `/api/theatre`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | ❌ | Get all theatres |
| GET | `/:theatreId` | ❌ | Get theatre by ID |
| POST | `/add` | ✅ | Add theatre |
| PUT | `/update/:theatreId` | ✅ | Update theatre |
| DELETE | `/delete/:theatreId` | ✅ | Delete theatre |

### Shows — `/api/shows`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | ❌ | Get all shows |
| GET | `/movie/:movieId` | ❌ | Shows by movie |
| GET | `/:showId` | ❌ | Show details (enriched) |
| POST | `/add` | ✅ | Schedule show |
| PUT | `/update/:showId` | ✅ | Update show |
| DELETE | `/delete/:showId` | ✅ | Delete show |

### Bookings — `/api/bookings`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/lock` | ✅ | Lock seats (10 min TTL) |
| POST | `/create` | ✅ | Confirm booking |
| GET | `/user` | ✅ | User's booking history |
| POST | `/cancel` | ✅ | Cancel booking |
| GET | `/all` | ✅ | All bookings (admin) |

### Favorites — `/api/favorite`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/add` | ✅ | Add to watchlist |
| DELETE | `/remove` | ✅ | Remove from watchlist |
| GET | `/user` | ✅ | Get user's watchlist |

### Reviews — `/api/review`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/add` | ✅ | Submit review |
| GET | `/movie/:movieId` | ❌ | Get movie reviews |
| PUT | `/update/:id` | ✅ | Update review |
| DELETE | `/delete/:id` | ✅ | Delete review |

---

## Booking Flow

```
Register / Login
      ↓
Browse Movies (/home)
      ↓
View Details (/moviedetails/:id)
      ↓
Select Show (/movieshows/:id)  ← 7-day calendar picker
      ↓
Pick Seats (/seatslug/:showId) ← Real-time Socket.io map
      ↓
Lock Seats (10-min TTL)
      ↓
Confirm & Pay
      ↓
Digital Ticket (/bookings)  ← Email confirmation sent
```

---

## Background Services

| Service | Schedule | Action |
|---------|----------|--------|
| **Cleanup** | Every minute | Releases seat locks older than 10 minutes |
| **Reminders** | Every hour | Emails users about shows tomorrow |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite, React Router v6, Tailwind CSS, Bootstrap 5 |
| Icons | FontAwesome 6, React Icons |
| HTTP Client | Axios |
| Notifications | React-Toastify |
| Date Handling | Day.js |
| Real-Time | Socket.io (client + server) |
| Backend | Node.js, Express.js |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Database | MongoDB + Mongoose ODM |
| Email | Nodemailer (Gmail SMTP) |
| Scheduler | node-cron |

---

> 
