import extend from 'deep-extend';

/**
 * Augment the request object with factory functions for generating templated success and failure
 * JSON responses.
 *
 * @param {Object} ctx Server-side application context
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Function invoked to pass logic to the next matching handler
 * @returns {*} Return value is unused.
 */
function middleware(ctx, req, res, next) {
  res.success = (data = {}) => {
    return res.send(extend({
      success: true
    }, data));
  };

  const defaultErrorMessage = 'There was an error completing the request.';
  res.error = (statusCode = 500, message = defaultErrorMessage, data = {}) => {
    res.status(statusCode);
    return res.send(extend({
      success: false,
      message
    }, data));
  };

  return next();
}

export default middleware;
