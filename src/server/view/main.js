import dottie from 'dottie';
import path from 'path';

/**
 * Main handler for serving client views.
 *
 * @param {Object} ctx Server-side application context
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
function handler(ctx, req, res) {
  // If the client IP is blacklisted, we'll serve a dedicated page with no client-side logic for
  // accessing the login API endpoints.
  const ip = dottie.get(req, 'headers.x-forwarded-for') ||
    dottie.get(req, 'connection.remoteAddress');
  if (ctx.blacklist.isBlacklisted(ip)) {
    return res.render(path.resolve(__dirname, '../../client/blacklist'));
  }

  return res.render(path.resolve(__dirname, '../../client/index'));
}

export default handler;
