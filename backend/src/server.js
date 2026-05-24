import dotenv from 'dotenv';
import app from './app.js';
import { connectDb } from './config/db.js';

dotenv.config();

if (!process.env.GROQ_API_KEY) {
  console.warn('Warning: GROQ_API_KEY is not set. The service will use static fallback analysis only.');
}

const port = process.env.PORT || 8080;

connectDb()
  .then(() => {
    startServer();
  })
  .catch((error) => {
    console.error('MongoDB connection failed; starting API with database-backed routes unavailable:', error.message);
    startServer();
  });

function startServer() {
  app.listen(port, () => {
    console.log(`API listening on port ${port}`);
  });
}
