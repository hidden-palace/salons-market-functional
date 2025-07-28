/**
 * Enhanced Error Middleware for Express Server
 */

const config = require('../config');

/**
 * Global error handler: logs error and sends JSON response
 */
function enhancedFailureHandler(failure, req, res, next) {
  console.error('=== API FAILURE ===');
  console.error('Failure:', failure);
  console.error('Stack:', failure.stack);
  console.error('Request URL:', req.url);
  console.error('Request Method:', req.method);
  console.error('Request Body:', req.body);

  if (res.headersSent) {
    return next(failure);
  }

  const statusCode = failure.status || 500;
  const responseBody = {
    message: failure.message || 'Internal server failure',
    timestamp: new Date().toISOString()
  };

  res.status(statusCode).json(responseBody);
}

/**
 * Request logger middleware: logs incoming requests and response status
 */
function requestLogger(req, res, next) {
  const start = Date.now();
  console.log(`Incoming: ${req.method} ${req.originalUrl}`);
  res.on('finish', () => {
    console.log(`Completed ${res.statusCode} in ${Date.now() - start}ms`);
  });
  next();
}

module.exports = {
  enhancedFailureHandler,
  requestLogger
};