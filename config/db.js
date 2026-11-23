// backend/config/db.js
import mongoose from 'mongoose';

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export default async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    // يقبل الاسمين: MONGODB_URI (الموجود في .env) أو MONGO_URI
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

    if (!uri) {
      throw new Error('MONGODB_URI is missing');
    }

    cached.promise = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000
    });
  }

  try {
    cached.conn = await cached.promise;
    console.log('✅ MongoDB Connected');
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    throw error;
  }
}
