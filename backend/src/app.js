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
app.use(helmet({ crossOriginResourcePolicy: false }));

const defaultClientOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://0.0.0.0:5173'];
const clientOrigins = [
  ...defaultClientOrigins,
  ...(process.env.CLIENT_ORIGIN?.split(',').map((origin) => origin.trim()).filter(Boolean) || [])
];
const allowAllOrigins = clientOrigins.includes('*') || clientOrigins.includes('all');

const corsOptions = {
  origin: allowAllOrigins
    ? true
    : function (origin, callback) {
        // allow non-browser requests (curl, server-to-server)
        if (!origin) return callback(null, true);
        // exact match
        if (clientOrigins.includes(origin)) return callback(null, true);
        // any vercel.app subdomain (covers preview deployments)
        if (/^https:\/\/[\w-]+(\.[\w-]+)*\.vercel\.app$/i.test(origin)) return callback(null, true);
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

console.log('CORS allowed origins:', allowAllOrigins ? 'all' : clientOrigins);

// handle preflight for all routes
app.options('*', cors(corsOptions));
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
