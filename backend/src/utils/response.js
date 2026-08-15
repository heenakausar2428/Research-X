/**
 * Formats and sends a success response.
 * @param {object} res Express response object
 * @param {string} message Description message
 * @param {object|array} data Payload data
 * @param {number} statusCode HTTP Status Code (default 200)
 */
export const sendSuccess = (res, message, data = null, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    errors: null,
  });
};

/**
 * Formats and sends an error response.
 * @param {object} res Express response object
 * @param {string} message Description message
 * @param {object|array|string} errors Detailed errors
 * @param {number} statusCode HTTP Status Code (default 500)
 */
export const sendError = (res, message, errors = null, statusCode = 500) => {
  // Normalize errors into an array if they are not already
  let formattedErrors = errors;
  if (errors && !Array.isArray(errors)) {
    formattedErrors = typeof errors === 'string' ? [errors] : [errors.message || errors];
  }

  return res.status(statusCode).json({
    success: false,
    message,
    data: null,
    errors: formattedErrors,
  });
};
