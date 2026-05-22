export function errorHandler(error, _req, res, _next) {
  if (error.name === 'ZodError') {
    return res.status(400).json({
      message: 'Validation failed',
      issues: error.errors.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message
      }))
    });
  }

  if (error.code === 11000) {
    return res.status(409).json({ message: 'Duplicate resource' });
  }

  const status = error.status || 500;
  const message = status === 500 ? 'Internal server error' : error.message;

  if (status === 500) {
    console.error(error);
  }

  res.status(status).json({ message });
}
