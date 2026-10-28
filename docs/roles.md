# Team Roles and Responsibilities

This document defines the team organization, functional roles, and core responsibilities for the design, development, and maintenance of the iMovies cinema ticketing application.

---

## Contribution Matrix

| Role | Primary Focus Area | Core Responsibilities | Key Deliverables & Modules |
|---|---|---|---|
| **Full-Stack Lead Architect** | System Design & Integration | - Architectural design and MVC structure<br>- End-to-end data lifecycle coordination<br>- Memory optimization and process constraints<br>- Git repository management and code reviews | - Project scaffolding<br>- `server/server.js`<br>- Environment configuration<br>- System documentation (`docs/`) |
| **Frontend Engineer & UI/UX Designer** | Client Experience & Interface | - Component architecture in React 18 & Vite<br>- NVIDIA Green (`#76b900`) design system<br>- Dark and light theme accessibility<br>- Client routing and authentication protection | - `client/src/pages/`<br>- `client/src/components/`<br>- `client/tailwind.config.js`<br>- Responsive mobile layouts |
| **Backend API Engineer** | Services, Models & Controllers | - REST API route and controller implementation<br>- Database schema definitions via Mongoose<br>- Data validation and business rule enforcement<br>- Performance indexing on high-traffic queries | - `server/models/`<br>- `server/controllers/`<br>- `server/routes/`<br>- `server/middlewares/fetchUser.js` |
| **Real-Time & Systems Engineer** | Concurrency & WebSockets | - Real-time seat synchronization via Socket.io<br>- Room partitioning (`show_${showId}`)<br>- 10-minute temporary seat holding mechanism<br>- Automated TTL cleanup background service | - `client/src/context/SocketContext.jsx`<br>- `server/utils/cleanupService.js`<br>- `server/utils/reminderService.js`<br>- `client/src/pages/SeatMap.jsx` |
| **Integrations & Payments Specialist** | Third-Party APIs & Transaction Security | - Razorpay checkout and order creation<br>- HMAC SHA256 cryptographic signature validation<br>- TMDB API live catalogue synchronization<br>- Brevo & Nodemailer transactional email services | - `server/controllers/paymentController.js`<br>- `server/services/tmdbService.js`<br>- `server/services/emailService.js`<br>- `client/src/components/PaymentModal.jsx` |
| **Security & Quality Assurance Engineer** | Testing, Auditing & Deployment | - Authentication security (JWT & bcrypt)<br>- Automated end-to-end user flow verification<br>- Cross-browser testing and crash prevention<br>- Memory leak detection and RAM cap management | - Memory cap enforcement (`--max-old-space-size=256`)<br>- Input validation audits<br>- Error handling & diagnostic endpoints (`/api/health`) |

---

## Detailed Responsibility Breakdown

### 1. Full-Stack Lead Architect
- Defines standards for commit conventions, project structure, and documentation.
- Monitors runtime memory constraints (ensuring the Node.js process operates comfortably beneath the 450 MB limit).
- Orchestrates seamless client-server API contract alignment.

### 2. Frontend Engineer & UI/UX Designer
- Implements visual parity across the application adhering to the NVIDIA Green, deep black, and white design scheme.
- Designs responsive components including the dynamic cinema seat map, ambient video trailer header, and printable digital ticket passes with QR codes.
- Maintains high frontend performance using code-splitting (`React.lazy` and `Suspense`).

### 3. Backend API Engineer
- Models domain schemas for movies, cinema halls, screening schedules, and customer reservations.
- Implements robust error handling and standardized JSON response payloads across all RESTful routes.
- Ensures data integrity through Mongoose pre-save validations and compound database indexes.

### 4. Real-Time & Systems Engineer
- Eliminates race conditions in seat reservation by implementing atomic state updates.
- Manages Socket.io connection lifecycles, connection recovery, and room-scoped event dispatch.
- Implements background cron tasks (`node-cron`) to automatically release abandoned seat locks back to the public pool.

### 5. Integrations & Payments Specialist
- Connects Razorpay test and production payment flows, guaranteeing tickets are only generated upon cryptographic signature verification.
- Implements automated sync routines with The Movie Database (TMDB) to maintain fresh releases, trailers, and cast profiles.
- Configures Brevo transactional email templates for account verification and booking confirmations.

### 6. Security & Quality Assurance Engineer
- Audits client and server environments to prevent exposure of sensitive credentials, secrets, or API keys.
- Conducts end-to-end regression testing on core transaction paths (login, seat map selection, payment modal, ticket issuance).
- Verifies system resilience and graceful degradation during network interruptions or third-party service downtime.
