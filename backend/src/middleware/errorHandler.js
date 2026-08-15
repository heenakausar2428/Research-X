import { sendError } from '../utils/response.js';

/**
 * Express error-handling middleware.
 */
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Always log errors for debugging
  console.error('--- ERROR DETECTED ---');
  console.error(err);

  // If in development mode, we can show details in logs, but never in response.
  if (process.env.NODE_ENV === 'development') {
    return devError(err, res);
  } else {
    return prodError(err, res);
  }
};

/**
 * Handles errors for the development environment.
 */
const devError = (err, res) => {
  return res.status(err.statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    data: null,
    errors: err.isOperational ? null : [err.message],
    // Include stack trace in dev response for easier debugging, but in a separate key
    stack: err.stack,
  });
};

/**
 * Handles errors for the production environment. (No stack trace exposure)
 */
const prodError = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    return sendError(res, err.message, null, err.statusCode);
  }

  // Handle Prisma unique constraint error specifically
  if (err.code === 'P2002') {
    const fields = err.meta?.target || [];
    return sendError(
      res,
      `A record with this ${fields.join(', ')} already exists.`,
      null,
      400
    );
  }

  // Handle JWT expired/invalid errors
  if (err.name === 'TokenExpiredError') {
    return sendError(res, 'Access token has expired. Please refresh.', null, 401);
  }
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 'Invalid authentication token. Please login again.', null, 401);
  }

  // Programming or other unknown error: don't leak details
  return sendError(res, 'Something went wrong on our end. Please try again later.', null, 500);
};

export default errorHandler;
