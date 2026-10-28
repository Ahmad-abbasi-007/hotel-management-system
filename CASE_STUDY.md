# Engineering Case Study: Zenvio Hotel Management System

---

## 1. Problem Statement

Hotels and hospitality businesses face significant operational friction when coordinating room reservations, front-desk customer service, and management oversight across disconnected platforms.

Common vulnerabilities in traditional or legacy booking systems include:
1. **Double Bookings & Schedule Clashes**: The absence of atomic or deterministic date-range overlap validation allows multiple guests to book the same room for the same night.
2. **Disconnected Roles & Data Silos**: Receptionists often operate on paper or separate local software, leading to mismatched room statuses (e.g., a room marked cleaning while occupied, or walk-in guests waiting while rooms sit idle).
3. **Manual Invoicing & Administrative Burden**: Manually generating invoices, factoring in itemized add-on amenities (spa, breakfast, extra beds), and calculating regional hospitality tax (10%) wastes staff time and introduces human calculation errors.
4. **Lack of Real-Time Operational Visibility**: Without central analytics, hoteliers cannot track room occupancy, revenue trends, and popular suite types.

**Zenvio** was engineered as an all-in-one, role-differentiated MERN architecture that solves these problems with strict database constraints, automated billing, and live dashboards for guests, front-desk receptionists, and hotel administrators.

---

## 2. Technology Choices & Architectural Reasoning

| Technology | Selection Rationale |
| :--- | :--- |
| **MongoDB Atlas & Mongoose** | Flexible document modeling allows rooms, bookings, and service add-ons to evolve naturally. Mongoose static methods allow encapsulating critical domain constraints directly inside the data layer. |
| **Express.js & Node.js** | Non-blocking asynchronous I/O enables responsive handling of concurrent reservation checks, transactional emails, and dynamic PDF streams without locking the main thread. |
| **React 18 + Vite** | Instant HMR development workflow, optimized static bundle building, client-side routing with React Router, and component-based UI isolation. |
| **TailwindCSS** | Eliminates CSS bloat, provides rapid prototyping of role-specific dashboards, and enables responsive layouts with consistent color and spacing tokens. |
| **JWT Authentication & RBAC** | Stateless authorization where user identity and role (`guest`, `receptionist`, `admin`) are encoded in cryptographically signed tokens, enforced with Express middleware. |
| **PDFKit** | Server-side vector document generation enables instant streaming of branded, itemized PDF tax invoices directly to the browser without external SaaS dependencies. |
| **Jest & Vitest** | Two-tiered testing strategy: Jest + Supertest with an in-memory MongoDB runner guarantees API reliability, while Vitest tests frontend component behavior. |

---

## 3. The Core Engineering Challenge: Deterministic Date Overlap Logic

### The Challenge
The single most critical failure mode of any reservation engine is permitting overlapping bookings on the same physical inventory. A naive validation approach checks if the new check-in or new check-out date falls within an existing booking interval:
```javascript
// ❌ WRONG: Flawed approach misses bookings completely engulfed by a longer stay
if (newCheckIn >= existing.checkIn && newCheckIn <= existing.checkOut) { ... }
```
This naive logic fails when a guest attempts to book a 1-day stay that sits entirely inside an existing 5-day stay, or when a new booking spans entirely across an existing reservation.

### The Mathematical Solution
Two time intervals $[A_{\text{start}}, A_{\text{end}}]$ and $[B_{\text{start}}, B_{\text{end}}]$ overlap if and only if:
$$\text{Existing Check-In} < \text{Requested Check-Out} \quad \land \quad \text{Existing Check-Out} > \text{Requested Check-In}$$

### Implementation in Mongoose
We implemented this rule as a static method on the `Booking` schema (`Booking.isRoomAvailable`):

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

---

## 4. Edge Cases Handled

### 1. Same-Day Checkout & Check-In (Back-to-Back Stays)
- **Scenario**: Guest A checks out on `2026-07-10`, and Guest B checks in on `2026-07-10`.
- **Handling**: Using strict inequality (`$lt` and `$gt`) rather than less-than-or-equal ensures that:
  $$\text{Existing Check-Out (July 10)} > \text{New Check-In (July 10)} \implies \text{False}$$
  The query returns no collision, correctly allowing same-day room turnover.

### 2. Past Date Rejections
- **Scenario**: A guest maliciously or inadvertently inputs check-in dates in the past.
- **Handling**: Controllers reject any check-in date where `new Date(checkIn) < today`, returning HTTP 400 with a descriptive error.

### 3. Inverted Date Range (`checkOut <= checkIn`)
- **Scenario**: Check-out date is set before or equal to check-in date.
- **Handling**: Enforced both on the client form validation and in `bookingController.js` before executing database queries. Minimum duration is 1 night.

### 4. Cancellation & Booking Modification
- **Scenario**: Guest cancels their reservation, or an existing booking is being updated.
- **Handling**: Cancelled bookings (`status: 'Cancelled'`) are excluded from availability checks. When updating an existing booking, `excludeBookingId` prevents the record from colliding with itself.

---

## 5. Test Proof Snippet

Automated testing forms the verification backbone of Zenvio. The following test snippet from `server/tests/api.test.js` demonstrates how date collision and back-to-back reservations are verified:

```javascript
test('🔑 REJECTS OVERLAPPING BOOKING', async () => {
  // Existing booking: day 2 to day 5
  await request(app)
    .post('/api/bookings')
    .set('Authorization', `Bearer ${guestToken}`)
    .send({
      roomId,
      checkIn: day(2),
      checkOut: day(5),
      serviceIds: []
    })
    .expect(201);

  // Overlapping booking: day 3 to day 6
  const res = await request(app)
    .post('/api/bookings')
    .set('Authorization', `Bearer ${guestToken}`)
    .send({
      roomId,
      checkIn: day(3),
      checkOut: day(6),
      serviceIds: []
    });

  expect(res.status).toBe(400);
  expect(res.body.message).toMatch(/available/i);
});

test('allows back-to-back booking (checkout = next checkin)', async () => {
  // Booking 1: day 10 to day 13
  await request(app)
    .post('/api/bookings')
    .set('Authorization', `Bearer ${guestToken}`)
    .send({
      roomId,
      checkIn: day(10),
      checkOut: day(13),
      serviceIds: []
    })
    .expect(201);

  // Booking 2: day 13 to day 16 (Day 13 is checkout and checkin)
  const res = await request(app)
    .post('/api/bookings')
    .set('Authorization', `Bearer ${guestToken}`)
    .send({
      roomId,
      checkIn: day(13),
      checkOut: day(16),
      serviceIds: []
    });

  expect(res.status).toBe(201);
});
```

### Full Test Suite Execution Summary
- **Backend**: 17 / 17 Jest integration tests passing (Auth, Rooms, Date Collisions, Invoice, RBAC).
- **Frontend**: 6 / 6 Vitest component tests passing (Form interaction, room search & filtering, empty states).
- **Total**: 23 / 23 Tests passing.

---

## 6. Next Steps & Future Roadmap

1. **Payment Gateway Integration (Stripe / JazzCash / EasyPaisa)**:
   - Transition from pay-at-check-in to online escrow and deposit payments with Stripe webhooks for instant booking confirmation.
2. **Real-Time WebSockets (Socket.io)**:
   - Push real-time inventory updates so that when a walk-in booking is made by the receptionist, the guest browsing the catalog immediately sees the room marked as booked without a page refresh.
3. **Guest Reviews & Ratings**:
   - Post-stay review system where verified guests can submit ratings and testimonials for specific room types.
4. **Dynamic & Seasonal Pricing Engine**:
   - Automated rate adjustments based on seasonal peaks, weekend surges, and occupancy thresholds.
5. **Cloud Object Storage for Room Images**:
   - Migrate local filesystem image uploads to AWS S3 or Cloudinary for stateless, horizontally scalable storage.
