import dotenv from 'dotenv';
import app from './app.js';
import { connectDb } from './config/db.js';

dotenv.config();

if (!process.env.GROQ_API_KEY) {
  console.warn('Warning: GROQ_API_KEY is not set. The service will use static fallback analysis only.');
}

// Connect to DB (works for both local and Vercel serverless)
connectDb()
  .then(() => console.log('MongoDB connected'))
  .catch((error) => console.error('MongoDB connection failed:', error.message));

const port = process.env.PORT || 8080;

// Only call listen() in local/non-serverless environments
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`API listening on port ${port}`);
  });
}

// Export app for Vercel serverless
export default app;
