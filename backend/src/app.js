import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import reviewRoutes from './routes/review.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import { errorHandler } from './middleware/error.js';
import { isDbConnected } from './config/db.js';

const app = express();

app.set('trust proxy', 1);
app.use(helmet());
const defaultClientOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://0.0.0.0:5173'];
const clientOrigins = [
  ...defaultClientOrigins,
  ...(process.env.CLIENT_ORIGIN?.split(',').map((origin) => origin.trim()).filter(Boolean) || [])
];
const allowAllOrigins = clientOrigins?.includes('*') || clientOrigins?.includes('all');
const corsOptions = {
  origin: allowAllOrigins
    ? true
    : function (origin, callback) {
        if (!origin) return callback(null, true);
        if (clientOrigins.includes(origin)) return callback(null, true);
        if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)) return callback(null, true);
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      },
  credentials: true
};

console.log('CORS allowed origins:', allowAllOrigins ? 'all' : clientOrigins);

app.use(cors(corsOptions));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 250,
    standardHeaders: true,
    legacyHeaders: false
  })
);

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'ai-code-reviewer-api', database: isDbConnected() ? 'connected' : 'unavailable' });
});

app.use('/api/reviews', reviewRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use(errorHandler);

export default app;
