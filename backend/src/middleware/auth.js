import { User } from '../models/User.js';
import { isDbConnected } from '../config/db.js';

export async function requireAuth(req, res, next) {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({ message: 'Database unavailable. Check MongoDB connection and try again.' });
    }

    req.user = await User.findOneAndUpdate(
      { email: 'demo@local.dev' },
      {
        $setOnInsert: {
          name: 'Demo User',
          email: 'demo@local.dev',
          role: 'developer'
        }
      },
      { new: true, upsert: true }
    );
    next();
  } catch (error) {
    next(error);
  }
}
