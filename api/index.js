import app from '../backend/src/app.js';
import { connectDb, isDbConnected } from '../backend/src/config/db.js';

export const config = {
  maxDuration: 30
};

let dbConnectionPromise;

async function ensureDbConnection() {
  if (isDbConnected() || !process.env.MONGODB_URI) return;

  dbConnectionPromise ||= connectDb().catch((error) => {
    dbConnectionPromise = null;
    console.error('MongoDB connection failed in serverless function:', error.message);
  });

  await dbConnectionPromise;
}

export default async function handler(req, res) {
  if (canRunWithoutDatabase(req.url)) {
    return app(req, res);
  }

  await ensureDbConnection();
  return app(req, res);
}

function canRunWithoutDatabase(url = '') {
  return url.startsWith('/api/health') || url.startsWith('/api/reviews/realtime');
}
