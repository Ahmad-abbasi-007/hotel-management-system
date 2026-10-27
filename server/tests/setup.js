const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret_key_for_jest_only';
process.env.NODE_ENV = 'test';

// Debug — dekhne ke liye ke URI load hua ya nahi
if (!process.env.MONGO_URI) {
  console.error('❌ MONGO_URI not found in .env! Check server/.env file.');
} else {
  console.log('✅ MONGO_URI loaded from .env');
}