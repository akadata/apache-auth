/**
 * Return 403 Forbidden in the requesting IP address is blacklisted.
 *
 * @param {Object} ctx Server-side application context
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Function invoked to pass logic to the next matching handler
 * @returns {*} Return value is unused.
 */
function middleware(ctx, req, res, next) {
  if (ctx.blacklist.isBlacklisted(req.remoteIP)) {
    return res.error(403, 'This IP address is blacklisted.');
  }

  return next();
}

export default middleware;
