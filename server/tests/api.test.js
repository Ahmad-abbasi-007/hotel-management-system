require('./setup');
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../src/models/User');
const Room = require('../src/models/Room');
const Booking = require('../src/models/Booking');

// Use real MongoDB Atlas from .env
let TEST_DB_URI = process.env.MONGO_URI;

if (!TEST_DB_URI) {
  console.error('❌ MONGO_URI missing. Tests cannot run.');
  process.exit(1);
}

// Replace main DB name with a test DB name to keep data isolated
TEST_DB_URI = TEST_DB_URI.replace(
  /mongodb\.net\/([^?]+)/,
  'mongodb.net/hotelDB_test'
);

console.log('🧪 Test DB:', TEST_DB_URI.replace(/:[^@]+@/, ':****@'));

let adminToken, guestToken, receptionistToken;
let roomId;

beforeAll(async () => {
  await mongoose.connect(TEST_DB_URI);
  console.log('✅ Connected to test DB');
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

beforeEach(async () => {
  await User.deleteMany({});
  await Room.deleteMany({});
  await Booking.deleteMany({});

  await User.create({ name: 'Admin', email: 'admin@test.com', password: 'pass1234', role: 'admin' });
  await User.create({ name: 'Guest', email: 'guest@test.com', password: 'pass1234', role: 'guest' });
  await User.create({ name: 'Recep', email: 'recep@test.com', password: 'pass1234', role: 'receptionist' });

  const adminRes = await request(app).post('/api/auth/login').send({ email: 'admin@test.com', password: 'pass1234' });
  adminToken = adminRes.body.token;

  const guestRes = await request(app).post('/api/auth/login').send({ email: 'guest@test.com', password: 'pass1234' });
  guestToken = guestRes.body.token;

  const recepRes = await request(app).post('/api/auth/login').send({ email: 'recep@test.com', password: 'pass1234' });
  receptionistToken = recepRes.body.token;

  const room = await Room.create({ roomNumber: '101', type: 'Single', price: 5000, capacity: 2 });
  roomId = room._id;
});

// ============ AUTH TESTS ============

describe('Auth', () => {
  test('registers a new user', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'New', email: 'new@test.com', password: 'pass1234', role: 'guest'
    });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('token');
  });

  test('rejects duplicate email', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'A', email: 'dup@test.com', password: 'pass1234'
    });
    const res = await request(app).post('/api/auth/register').send({
      name: 'B', email: 'dup@test.com', password: 'pass1234'
    });
    expect(res.statusCode).toBe(400);
  });

  test('logs in with correct credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'guest@test.com', password: 'pass1234' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  test('rejects invalid password', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'guest@test.com', password: 'wrong' });
    expect(res.statusCode).toBe(401);
  });
});

// ============ ROOM TESTS ============

describe('Rooms', () => {
  test('admin can create room', async () => {
    const res = await request(app)
      .post('/api/rooms')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ roomNumber: '202', type: 'Double', price: 8000, capacity: 3 });
    expect(res.statusCode).toBe(201);
  });

  test('guest cannot create room (403)', async () => {
    const res = await request(app)
      .post('/api/rooms')
      .set('Authorization', `Bearer ${guestToken}`)
      .send({ roomNumber: '303', type: 'Suite', price: 15000, capacity: 4 });
    expect(res.statusCode).toBe(403);
  });

  test('unauthenticated cannot create room (401)', async () => {
    const res = await request(app).post('/api/rooms').send({
      roomNumber: '404', type: 'Single', price: 5000, capacity: 2
    });
    expect(res.statusCode).toBe(401);
  });

  test('get all rooms works publicly', async () => {
    const res = await request(app).get('/api/rooms');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// ============ BOOKING TESTS ============

describe('Bookings', () => {
  const futureDate = (daysAhead) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    return d.toISOString().split('T')[0];
  };

  test('guest can create a booking with correct price', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${guestToken}`)
      .send({ roomId, checkIn: futureDate(2), checkOut: futureDate(5) });

    expect(res.statusCode).toBe(201);
    expect(res.body.nights).toBe(3);
    expect(res.body.totalPrice).toBe(16500);
  });

  test('🔑 REJECTS OVERLAPPING BOOKING', async () => {
    await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${guestToken}`)
      .send({ roomId, checkIn: futureDate(10), checkOut: futureDate(15) });

    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${guestToken}`)
      .send({ roomId, checkIn: futureDate(12), checkOut: futureDate(18) });

    expect(res.statusCode).toBe(409);
    expect(res.body.message).toMatch(/already booked/i);
  });

  test('allows back-to-back booking (checkout = next checkin)', async () => {
    await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${guestToken}`)
      .send({ roomId, checkIn: futureDate(20), checkOut: futureDate(23) });

    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${guestToken}`)
      .send({ roomId, checkIn: futureDate(23), checkOut: futureDate(26) });

    expect(res.statusCode).toBe(201);
  });

  test('rejects past check-in date', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${guestToken}`)
      .send({ roomId, checkIn: '2020-01-01', checkOut: '2020-01-05' });
    expect(res.statusCode).toBe(400);
  });

  test('rejects check-out before check-in', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${guestToken}`)
      .send({ roomId, checkIn: futureDate(10), checkOut: futureDate(5) });
    expect(res.statusCode).toBe(400);
  });

  test('guest can fetch only their own bookings', async () => {
    await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${guestToken}`)
      .send({ roomId, checkIn: futureDate(5), checkOut: futureDate(7) });

    const res = await request(app)
      .get('/api/bookings/my')
      .set('Authorization', `Bearer ${guestToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
  });

  test('guest can cancel booking and room is freed', async () => {
    const createRes = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${guestToken}`)
      .send({ roomId, checkIn: futureDate(5), checkOut: futureDate(8) });

    const res = await request(app)
      .put(`/api/bookings/${createRes.body._id}/cancel`)
      .set('Authorization', `Bearer ${guestToken}`);
    expect(res.statusCode).toBe(200);

    const room = await Room.findById(roomId);
    expect(room.status).toBe('Available');
  });

  test('receptionist can check-in booking', async () => {
    const createRes = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${guestToken}`)
      .send({ roomId, checkIn: futureDate(1), checkOut: futureDate(3) });

    const res = await request(app)
      .put(`/api/bookings/${createRes.body._id}/status`)
      .set('Authorization', `Bearer ${receptionistToken}`)
      .send({ status: 'CheckedIn' });
    expect(res.statusCode).toBe(200);
    expect(res.body.booking.status).toBe('CheckedIn');
  });

  test('guest cannot change booking status (403)', async () => {
    const createRes = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${guestToken}`)
      .send({ roomId, checkIn: futureDate(2), checkOut: futureDate(4) });

    const res = await request(app)
      .put(`/api/bookings/${createRes.body._id}/status`)
      .set('Authorization', `Bearer ${guestToken}`)
      .send({ status: 'CheckedIn' });
    expect(res.statusCode).toBe(403);
  });
});