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
    app.listen(port, () => {
      console.log(`API listening on port ${port}`);
    });
  })
  .catch((error) => {
    console.error('Failed to start server', error);
    process.exit(1);
  });
