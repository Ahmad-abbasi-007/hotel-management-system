# Zenvio Hotel Management System

A full-stack MERN application providing hotel reservation management, front-desk operations, role-based workflows, dynamic analytics, and automated guest invoicing.

---

## 🌐 Live Demos

| Service | Environment | URL |
| :--- | :--- | :--- |
| **Frontend Web App** | Vercel | `https://[YOUR-VERCEL-FRONTEND-URL].vercel.app` *(Placeholder)* |
| **Backend REST API** | Render | `https://[YOUR-RENDER-BACKEND-URL].onrender.com` *(Placeholder)* |

---

## 🛠️ Tech Stack

| Technology | Layer / Purpose | Key Details |
| :--- | :--- | :--- |
| **React 18** | Frontend Framework | Single Page Application built with Vite & React Router v7 |
| **TailwindCSS** | UI & Styling | Responsive design system, custom cards, accessible UI |
| **Node.js** | Runtime Environment | JavaScript asynchronous runtime (v20+ / v22+) |
| **Express.js** | Backend API Framework | REST API with modular routers, controllers, and middleware |
| **MongoDB Atlas** | Database | Cloud NoSQL database with Mongoose ODM schemas & indexes |
| **JWT (JSON Web Token)** | Authentication | Secure token-based auth with role-based route guards |
| **Recharts** | Data Visualization | Interactive charts (Revenue bar chart, Room type pie chart, Occupancy) |
| **PDFKit** | Invoicing Engine | Server-side vector PDF generator for printable guest tax invoices |
| **Nodemailer** | Notifications | Automated transactional emails (confirmation, cancellation) |
| **Vitest & RTL** | Frontend Testing | Unit and integration testing for React components |
| **Jest & Supertest** | Backend Testing | Automated API integration test suite (in-memory MongoDB) |

---

## 🌟 Key Features

### 1. Role-Based Access Control (3 Distinct Roles)
- **Guest**:
  - Personalized dashboard with real-time room overview and personal booking stats.
  - Room discovery with filtering by room type, maximum budget (PKR), and capacity.
  - Multi-night room reservation with optional add-on guest services (Spa, Breakfast, Laundry).
  - Booking tracking and instant PDF invoice download.
  - Self-service cancellation with automated room liberation.
- **Receptionist**:
  - Front-desk operations dashboard (Pending check-ins, in-house guests, checked-out records).
  - Walk-in guest booking creation directly from available room inventory.
  - One-click Check-In and Check-Out state management.
  - Full visibility of all active and upcoming reservations.
- **Admin**:
  - Executive overview displaying total rooms, bookings, registered guests, PKR revenue, and occupancy rate.
  - Interactive Analytics Dashboard with customizable date range filtering.
  - Complete Room Inventory CRUD with multipart image upload (JPEG, PNG, WebP).
  - Hotel service catalog management (pricing, amenity descriptions).
  - Cross-role oversight into front desk operations.

### 2. High-Integrity Business Logic
- **Date Overlap Prevention**: Rigorous mathematical range checking preventing double bookings while cleanly permitting same-day checkout/checkin transitions.
- **Automated Transparent Pricing**: Dynamic live recalculation factoring total nights, room rate, selected services, and a standard 10% hospitality tax.
- **Lifecycle Room States**: Real-time room transition logic (`Available` → `Booked` → `Occupied` → `Cleaning`).
- **Downloadable Invoices**: On-the-fly generated PDF receipts containing booking identifiers, breakdown of nights, tax calculations, and hotel details.
- **Full Test Suite**: 23 automated tests (17 backend integration tests, 6 frontend component tests) covering all critical workflows.

---

## 🏗️ System Architecture

```
+-------------------------------------------------------------------------+
|                              CLIENT (Vercel)                            |
|  +--------------------+   +-----------------------+   +---------------+ |
|  |     React Router   |   |   AuthContext (JWT)   |   | Tailwind CSS  | |
|  +--------------------+   +-----------------------+   +---------------+ |
|  | Pages: Home (Dashboard), Rooms, Details, Bookings, Reception, Admin | |
+------------------------------------+------------------------------------+
                                     |
                          HTTPS REST / Axios Calls
                                     v
+------------------------------------+------------------------------------+
|                              SERVER (Render)                            |
|  +-------------------------------------------------------------------+  |
|  | Express App + CORS Validator (*.vercel.app, *.onrender.com, dev)  |  |
|  +-------------------------------------------------------------------+  |
|  | Middlewares: authMiddleware (JWT Verification & Role Guard)        |  |
|  +-------------------+--------------------+--------------------------+  |
|  | Controllers:      | Controllers:       | Utilities:               |  |
|  | - authController  | - statsController  | - invoice.js (PDFKit)    |  |
|  | - roomController  | - uploadController | - email.js (Nodemailer)  |  |
|  | - bookingCtrl     | - serviceController|                          |  |
|  +-------------------+--------------------+--------------------------+  |
+------------------------------------+------------------------------------+
                                     |
                                Mongoose ODM
                                     v
+------------------------------------+------------------------------------+
|                         DATABASE (MongoDB Atlas)                        |
|   Collections: users | rooms | bookings | services                      |
+-------------------------------------------------------------------------+
```

---

## ⚡ Date Overlap Logic Explanation

A primary failure mode in reservation systems is double booking. In Zenvio, this is solved deterministically in the Mongoose `Booking` model via the `isRoomAvailable` static method:

### Mathematical Principle
Two date intervals $[A_{\text{start}}, A_{\text{end}}]$ and $[B_{\text{start}}, B_{\text{end}}]$ overlap if and only if:
$$\text{Existing Check-In} < \text{Requested Check-Out} \quad \text{AND} \quad \text{Existing Check-Out} > \text{Requested Check-In}$$

### The Mongoose Query
```javascript
bookingSchema.statics.isRoomAvailable = async function (
  roomId,
  checkIn,
  checkOut,
  excludeBookingId = null
) {
  const query = {
    room: roomId,
    status: { $in: ['Confirmed', 'CheckedIn'] },
    checkIn: { $lt: new Date(checkOut) },
    checkOut: { $gt: new Date(checkIn) }
  };

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  const existing = await this.findOne(query);
  return !existing;
};
```

### Why Strict Inequality (`<` and `>`) Matters
- Using strict comparison allows back-to-back bookings. If Guest A checks out on `2026-06-15 11:00 AM`, Guest B can check in on `2026-06-15 02:00 PM` without triggering an overlap conflict.
- Cancelled or checked-out bookings do not block dates because the query restricts checks to `{ $in: ['Confirmed', 'CheckedIn'] }`.

---

## 🧪 Test Coverage Summary (23/23 Passing)

```
Test Suites: 1 passed backend, 2 passed frontend (3 total)
Tests:       17 passed (backend) + 6 passed (frontend) = 23 Total Tests
```

### Backend Test Matrix (`server/tests/api.test.js`)
- **Authentication**:
  - `registers a new user` (Status 201 + JWT)
  - `rejects duplicate email` (Status 400)
  - `logs in with correct credentials` (Status 200)
  - `rejects invalid password` (Status 401)
- **Room Management**:
  - `admin can create room` (Status 201)
  - `guest cannot create room` (Status 403 Forbidden)
  - `unauthenticated cannot create room` (Status 401 Unauthorized)
  - `get all rooms works publicly` (Status 200)
- **Booking & Availability Integrity**:
  - `guest can create a booking with correct price`
  - `🔑 REJECTS OVERLAPPING BOOKING` (Strict date collision validation)
  - `allows back-to-back booking (checkout = next checkin)`
  - `rejects past check-in date`
  - `rejects check-out before check-in`
  - `guest can fetch only their own bookings`
  - `guest can cancel booking and room is freed`
  - `receptionist can check-in booking`
  - `guest cannot change booking status (403)`

### Frontend Test Matrix (`client/src/tests/`)
- `Rooms Page`: Shows loading state, renders room catalog with pricing, handles empty search states, filters by type.
- `Login Page`: Form inputs rendering, heading verification, submission to `/auth/login` with credentials.

---

## 💻 Local Setup & Development

### Prerequisites
- Node.js `20.x` or `22.x`
- npm `10.x` or higher
- MongoDB Atlas database connection string

### 1. Server Configuration
```bash
cd server
npm install
```

Create `server/.env`:
```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/hotelDB?retryWrites=true&w=majority
JWT_SECRET=super_secret_jwt_key_zenvio_2026
FRONTEND_URL=http://localhost:5173
```

Run tests & development server:
```bash
# Run 17 backend tests
npm test

# Run development server
npm run dev
```

### 2. Client Configuration
```bash
cd client
npm install
```

Create `client/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

Run tests & development server:
```bash
# Run 6 frontend vitest tests
npm test

# Run development server
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🚀 Deployment Guide

### Backend Deployment (Render.com)
1. Go to **Render Dashboard** → **New +** → **Web Service**.
2. Connect your Git repository.
3. Configure service parameters:
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start` *(or `node index.js`)*
4. Configure Environment Variables in Render:
   - `MONGO_URI`: `mongodb+srv://...`
   - `JWT_SECRET`: Generate a secure 32+ character random secret
   - `PORT`: `5000` (or leave default assigned by Render)
   - `FRONTEND_URL`: `https://your-app.vercel.app` (your Vercel frontend domain)
5. Deploy Web Service.

### Frontend Deployment (Vercel.com)
1. Go to **Vercel Dashboard** → **Add New Project**.
2. Select the repository.
3. Configure project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `client`
4. Add Environment Variable:
   - `VITE_API_URL`: `https://your-render-service.onrender.com/api`
5. Deploy.
6. Once deployed, verify that `client/vercel.json` and `client/public/_redirects` preserve client-side routing on page refreshes.

---

## 📄 License
ISC License. Built for Zenvio Hotel Management Capstone.
