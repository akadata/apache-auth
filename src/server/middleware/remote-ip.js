import dottie from 'dottie';

/**
 * Augment the request object with the remote user's IP address, or null if it is unknown.
 *
 * @param {Object} ctx Server-side application context
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Function invoked to pass logic to the next matching handler
 * @returns {*} Return value is unused.
 */
function middleware(ctx, req, res, next) {
  req.remoteIP = dottie.get(req, 'headers.x-forwarded-for') ||
    dottie.get(req, 'connection.remoteAddress') || null;

  return next();
}

export default middleware;
