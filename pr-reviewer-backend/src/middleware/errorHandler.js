/**
 * Global Express error handling middleware.
 */

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  if (res.headersSent) {
    return _next(err);
  }

  const timestamp = new Date().toISOString();
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  console.error(`[${timestamp}] ERROR ${statusCode}: ${message}`);
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  // Don't expose internal error details in production for 500s
  const responseMessage = (statusCode >= 500 && process.env.NODE_ENV === 'production')
    ? 'Internal Server Error'
    : message;

  res.status(statusCode).json({
    error: responseMessage,
    code: statusCode,
  });
}

module.exports = errorHandler;
