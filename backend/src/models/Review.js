import mongoose from 'mongoose';

const findingSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    type: {
      type: String,
      enum: ['bug', 'security', 'unused-code', 'duplicate-code', 'performance', 'readability', 'maintainability'],
      required: true
    },
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    line: { type: Number, default: 1 },
    endLine: { type: Number },
    title: { type: String, required: true },
    message: { type: String, required: true },
    suggestedFix: { type: String, default: '' },
    snippet: { type: String, default: '' }
  },
  { _id: false }
);

const scoreSchema = new mongoose.Schema(
  {
    security: { type: Number, min: 0, max: 100, default: 75 },
    readability: { type: Number, min: 0, max: 100, default: 75 },
    performance: { type: Number, min: 0, max: 100, default: 75 },
    maintainability: { type: Number, min: 0, max: 100, default: 75 },
    overall: { type: Number, min: 0, max: 100, default: 75 }
  },
  { _id: false }
);

const reviewSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    filename: { type: String, required: true },
    language: { type: String, default: 'javascript' },
    code: { type: String, required: true },
    summary: { type: String, default: '' },
    status: { type: String, enum: ['queued', 'completed', 'failed'], default: 'completed' },
    findings: [findingSchema],
    scores: { type: scoreSchema, default: () => ({}) },
    model: { type: String, default: '' }
  },
  { timestamps: true }
);

export const Review = mongoose.model('Review', reviewSchema);
