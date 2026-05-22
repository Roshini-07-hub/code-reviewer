import { User } from '../models/User.js';

export async function requireAuth(req, res, next) {
  try {
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
