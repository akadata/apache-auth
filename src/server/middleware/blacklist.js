/**
 * TODO
 *
 * @param ctx
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
function middleware(ctx, req, res, next) {
  if (ctx.blacklist.isBlacklisted(req.remoteIP)) {
    return res.error(403, 'This IP address is blacklisted.');
  }

  return next();
}

export default middleware;
