import mongoose from 'mongoose';
import 'dotenv/config';

let activeMode = 'disconnected';

export const databaseConfigured = Boolean(process.env.MONGODB_URI);

const sanitizeErrorMessage = (msg = '') => {
  return String(msg)
    .replace(/mongodb\+srv:\/\/[^@]+@/gi, 'mongodb+srv://<redacted>@')
    .replace(/mongodb:\/\/[^@]+@/gi, 'mongodb://<redacted>@')
    .replace(/:[^:@]+@/g, ':<redacted>@');
};

export async function initializeDatabase() {
  if (mongoose.connection.readyState === 1) {
    return true;
  }

  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('MONGODB_URI is not defined in environment.');
    activeMode = 'disconnected';
    return false;
  }

  try {
    await mongoose.connect(uri, {
      dbName: 'maha_health_connect',
      serverSelectionTimeoutMS: 10000
    });
    console.log('Connected to MongoDB Atlas successfully');
    activeMode = 'MongoDB Atlas';
    return true;
  } catch (error) {
    const cleanError = sanitizeErrorMessage(error.message);
    console.error('MongoDB Atlas connection failed:', cleanError);
    activeMode = 'disconnected';
    return false;
  }
}

export async function databaseHealth() {
  const isConnected = mongoose.connection.readyState === 1;
  return {
    configured: Boolean(process.env.MONGODB_URI),
    connected: isConnected,
    mode: isConnected ? activeMode : 'disconnected'
  };
}

export async function closeDatabase() {
  if (mongoose.connection.readyState !== 0) {
    try {
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.db.admin().command({ fsync: 1 });
      }
    } catch {
      // Ignore
    }
    await mongoose.disconnect();
  }
  activeMode = 'disconnected';
}
