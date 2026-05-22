import { Router } from 'express';
import {
  addComment,
  createReview,
  exportReviewPdf,
  getReview,
  listReviews,
  realtimeReview,
  deleteReview,
  updateComment
} from '../controllers/review.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.post('/', createReview);
router.get('/', listReviews);
router.post('/realtime', realtimeReview);
router.get('/:id', getReview);
router.get('/:id/pdf', exportReviewPdf);
router.delete('/:id', deleteReview);
router.post('/:id/comments', addComment);
router.patch('/:id/comments/:commentId', updateComment);

export default router;
