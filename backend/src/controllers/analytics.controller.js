import { Review } from '../models/Review.js';

export async function getSummary(req, res, next) {
  try {
    const reviews = await Review.find({ owner: req.user._id }).select('scores findings createdAt language');
    const totals = {
      reviews: reviews.length,
      findings: reviews.reduce((sum, review) => sum + review.findings.length, 0),
      averageOverall: average(reviews.map((review) => review.scores?.overall ?? 0)),
      averageSecurity: average(reviews.map((review) => review.scores?.security ?? 0))
    };

    const severity = { low: 0, medium: 0, high: 0, critical: 0 };
    const categories = {};

    reviews.forEach((review) => {
      review.findings.forEach((finding) => {
        severity[finding.severity] += 1;
        categories[finding.type] = (categories[finding.type] || 0) + 1;
      });
    });

    const trend = reviews
      .slice()
      .sort((a, b) => a.createdAt - b.createdAt)
      .slice(-12)
      .map((review) => ({
        date: review.createdAt.toISOString().slice(0, 10),
        overall: review.scores.overall,
        security: review.scores.security,
        findings: review.findings.length
      }));

    res.json({
      totals,
      severity: Object.entries(severity).map(([name, value]) => ({ name, value })),
      categories: Object.entries(categories).map(([name, value]) => ({ name, value })),
      trend
    });
  } catch (error) {
    next(error);
  }
}

function average(values) {
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}
