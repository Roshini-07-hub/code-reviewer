import mongoose from 'mongoose';

const MONGO_TIMEOUT_MS = Number(process.env.MONGO_TIMEOUT_MS || 10000);

export async function connectDb() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required');
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: MONGO_TIMEOUT_MS
  });
  console.log('MongoDB connected');
}

export function isDbConnected() {
  return mongoose.connection.readyState === 1;
}
