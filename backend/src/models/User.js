import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    role: { type: String, enum: ['developer', 'lead', 'admin'], default: 'developer' }
  },
  { timestamps: true }
);

export const User = mongoose.model('User', userSchema);
