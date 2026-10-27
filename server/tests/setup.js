const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret_key_for_jest_only';
process.env.NODE_ENV = 'test';

if (!process.env.MONGO_URI) {
  console.error('MONGO_URI is required in server/.env to run the API tests.');
}