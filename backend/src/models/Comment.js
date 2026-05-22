import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    review: { type: mongoose.Schema.Types.ObjectId, ref: 'Review', required: true, index: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    line: { type: Number, required: true },
    body: { type: String, required: true, trim: true },
    resolved: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const Comment = mongoose.model('Comment', commentSchema);
