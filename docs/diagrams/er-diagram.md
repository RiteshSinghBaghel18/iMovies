# Entity-Relationship (ER) Diagram

This document defines the data schema relationships of the iMovies cinema ticketing platform. The database uses MongoDB with Mongoose ODM to model entities, reference keys, and nested structures.

```mermaid
erDiagram
    USER ||--o{ BOOKING : "places"
    USER ||--o{ REVIEW : "writes"
    USER ||--o{ FAVORITE : "bookmarks"
    ADMIN ||--o{ SHOW : "schedules"
    
    MOVIE ||--o{ SHOW : "featured in"
    MOVIE ||--o{ REVIEW : "receives"
    MOVIE ||--o{ FAVORITE : "saved as"
    
    THEATRE ||--o{ SHOW : "hosts"
    SHOW ||--o{ BOOKING : "reserves seats for"

    USER {
        ObjectId _id PK
        string username
        string email UK
        string password
        string role
        boolean isVerified
        string verificationToken
        date verificationTokenExpires
        string verificationOtp
        date verificationOtpExpires
        string resetPasswordToken
        date resetPasswordExpires
        date createdAt
        date updatedAt
    }

    ADMIN {
        ObjectId _id PK
        string username UK
        string email UK
        string password
        string role
        date createdAt
        date updatedAt
    }

    MOVIE {
        ObjectId _id PK
        string movieName
        string description
        string[] genres
        date releaseDate
        string language
        string duration
        string certification
        float rating
        string posterUrl
        string backdropUrl
        string trailerUrl
        string category
        boolean isAdminAdded
        boolean isCustom
        object[] cast
        date createdAt
        date updatedAt
    }

    THEATRE {
        ObjectId _id PK
        string theatreId UK
        string theatreName
        string location
        number balconySeatPrice
        number middleSeatPrice
        number lowerSeatPrice
        object balconySeats
        object middleSeats
        object lowerSeats
        string[] amenities
        date createdAt
        date updatedAt
    }

    SHOW {
        ObjectId _id PK
        string showId UK
        string adminEmail FK
        string movieId FK
        string theatreId FK
        string theatreName
        string showDate
        string showTime
        object tickets
        object pricing
        date createdAt
        date updatedAt
    }

    BOOKING {
        ObjectId _id PK
        string bookingId UK
        string userEmail FK
        string showId FK
        string[] selectedSeats
        number totalAmount
        string paymentStatus
        string paymentMethod
        string transactionId
        string razorpayOrderId
        string razorpayPaymentId
        string razorpaySignature
        string refundId
        number refundAmount
        string refundStatus
        date refundedAt
        object movieDetails
        object theatreDetails
        string showDate
        string showTime
        date createdAt
        date updatedAt
    }

    REVIEW {
        ObjectId _id PK
        string movieId FK
        string userEmail FK
        string username
        number rating
        string reviewText
        date createdAt
        date updatedAt
    }

    FAVORITE {
        ObjectId _id PK
        string userEmail FK
        string movieId FK
        date createdAt
        date updatedAt
    }
```

---

## Schema Highlights

### 1. Embedded Real-Time Ticket Grid (`Show.tickets`)
Unlike relational systems that store every seat as an individual database row, each `Show` record stores a fast indexed dictionary of seats:
- **Key Pattern**: `seatId` (e.g., `B-A1`, `M-C4`, `L-G10`).
- **Seat Document**:
  ```json
  {
    "seatId": "B-A1",
    "seatNumber": "B-A1",
    "row": "A",
    "col": 1,
    "tier": "balcony",
    "tierLabel": "Balcony (VIP)",
    "price": 350,
    "status": "available",
    "lockedBy": null,
    "lockExpiresAt": null,
    "bookingId": null
  }
  ```
- **Concurrency & Locking**: When a customer selects seats, the status switches to `locked` with a 10-minute TTL timestamp (`lockExpiresAt`). Background cron jobs automatically revert stale holds back to `available`.

### 2. Snapshot Integrity in Bookings
To protect financial and audit history against future catalogue edits:
- Each `Booking` stores immutable snapshot objects of `movieDetails` (name, poster, duration) and `theatreDetails` (theatre name, physical address) at the time of purchase.
- Razorpay order ID, payment ID, and cryptographic HMAC signatures are stored directly on the booking document for verification and instant refund processing.
