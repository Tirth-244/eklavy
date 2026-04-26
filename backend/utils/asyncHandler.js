/**
 * Wraps an async route handler to catch errors and forward to Express error middleware.
 * Eliminates the need for try-catch blocks in every controller.
 * @param {Function} fn - Async route handler function
 * @returns {Function} Express middleware function
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
