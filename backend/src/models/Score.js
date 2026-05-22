import mongoose from 'mongoose';

const scoreSchema = new mongoose.Schema(
  {
    review: { type: mongoose.Schema.Types.ObjectId, ref: 'Review', required: true, index: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    security: { type: Number, min: 0, max: 100, required: true },
    readability: { type: Number, min: 0, max: 100, required: true },
    performance: { type: Number, min: 0, max: 100, required: true },
    maintainability: { type: Number, min: 0, max: 100, required: true },
    overall: { type: Number, min: 0, max: 100, required: true }
  },
  { timestamps: true }
);

export const Score = mongoose.model('Score', scoreSchema);
