import PDFDocument from 'pdfkit';
import { z } from 'zod';
import { Comment } from '../models/Comment.js';
import { Review } from '../models/Review.js';
import { Score } from '../models/Score.js';
import { reviewCode } from '../services/openaiReviewer.js';

const reviewSchema = z.object({
  title: z.string().min(2),
  filename: z.string().min(1),
  language: z.string().min(1),
  code: z.string().min(1).max(120000)
});

const commentSchema = z.object({
  line: z.number().int().positive(),
  body: z.string().min(1).max(2000)
});

export async function createReview(req, res, next) {
  try {
    const payload = reviewSchema.parse(req.body);
    const result = await reviewCode(payload);
    const review = await Review.create({
      owner: req.user._id,
      ...payload,
      ...result
    });
    await Score.create({
      review: review._id,
      owner: req.user._id,
      ...result.scores
    });

    res.status(201).json({ review });
  } catch (error) {
    next(error);
  }
}

export async function listReviews(req, res, next) {
  try {
    const reviews = await Review.find({ owner: req.user._id })
      .select('-code')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ reviews });
  } catch (error) {
    next(error);
  }
}

export async function getReview(req, res, next) {
  try {
    const review = await Review.findOne({ _id: req.params.id, owner: req.user._id });
    if (!review) return res.status(404).json({ message: 'Review not found' });

    const comments = await Comment.find({ review: review._id }).populate('author', 'name email').sort({ line: 1 });
    res.json({ review, comments });
  } catch (error) {
    next(error);
  }
}

export async function realtimeReview(req, res, next) {
  try {
    const payload = reviewSchema.parse({
      title: 'Realtime analysis',
      filename: 'editor-buffer',
      ...req.body
    });
    const result = await reviewCode(payload);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function addComment(req, res, next) {
  try {
    const review = await Review.findOne({ _id: req.params.id, owner: req.user._id });
    if (!review) return res.status(404).json({ message: 'Review not found' });

    const payload = commentSchema.parse(req.body);
    const comment = await Comment.create({
      review: review._id,
      author: req.user._id,
      ...payload
    });

    res.status(201).json({ comment });
  } catch (error) {
    next(error);
  }
}

export async function updateComment(req, res, next) {
  try {
    const review = await Review.findOne({ _id: req.params.id, owner: req.user._id });
    if (!review) return res.status(404).json({ message: 'Review not found' });

    const comment = await Comment.findOneAndUpdate(
      { _id: req.params.commentId, review: review._id },
      { $set: { resolved: Boolean(req.body.resolved) } },
      { new: true }
    );
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    res.json({ comment });
  } catch (error) {
    next(error);
  }
}

export async function exportReviewPdf(req, res, next) {
  try {
    const review = await Review.findOne({ _id: req.params.id, owner: req.user._id });
    if (!review) return res.status(404).json({ message: 'Review not found' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${review.filename}-review.pdf"`);

    const doc = new PDFDocument({ margin: 42 });
    doc.pipe(res);
    doc.fontSize(20).text(review.title);
    doc.moveDown().fontSize(10).text(`${review.filename} | ${review.language} | Overall ${review.scores.overall}/100`);
    doc.moveDown().fontSize(12).text(review.summary);
    doc.moveDown();
    review.findings.forEach((finding) => {
      doc.fontSize(12).text(`${finding.severity.toUpperCase()} ${finding.type} on line ${finding.line}: ${finding.title}`);
      doc.fontSize(10).text(finding.message);
      if (finding.suggestedFix) doc.text(`Fix: ${finding.suggestedFix}`);
      doc.moveDown(0.7);
    });
    doc.end();
  } catch (error) {
    next(error);
  }
}

export async function deleteReview(req, res, next) {
  try {
    const review = await Review.findOne({ _id: req.params.id, owner: req.user._id });
    if (!review) return res.status(404).json({ message: 'Review not found' });

    await Comment.deleteMany({ review: review._id });
    await Score.deleteOne({ review: review._id });
    await Review.deleteOne({ _id: review._id });

    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
}
