import dottie from 'dottie';

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
  req.remoteIP = dottie.get(req, 'headers.x-forwarded-for') ||
    dottie.get(req, 'connection.remoteAddress') || null;

  return next();
}

export default middleware;
