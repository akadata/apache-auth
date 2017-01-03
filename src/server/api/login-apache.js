import dottie from 'dottie';
import duo from 'duo_web';

import authenticate from './authenticate';
import secrets from '../../../config/secrets';

/**
 * Attempt to log the user in.
 *
 * @param {Object} ctx Server-side application context
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
function handler(ctx, req, res) {
  // First check if the IP address is blacklisted
  const ip = dottie.get(req, 'headers.x-forwarded-for') ||
    dottie.get(req, 'connection.remoteAddress');
  if (ctx.blacklist.isBlacklisted(ip)) {
    res.status(403);
    return res.send({
      success: false,
      message: 'This IP address is blacklisted.'
    });
  }

  // Verify the 2FA response from Duo
  if (!duo.verify_response(secrets.DUO_IKEY, secrets.DUO_SKEY, secrets.DUO_AKEY, req.body.sigResponse)) {
    res.status(401);
    return res.send({
      success: false,
      message: 'Duo 2FA response could not be validated.'
    });
  }

  // Then, authenticate against Apache one more time, setting the client cookie
  return authenticate.check(req.body.username, req.body.password, (err, resp) => {
    if (err) {
      // Even if there is an error, we're safe to continue: the response from Apache should be
      // directly replicated to the client like a proxy
    }

    // Replicate the Apache handler's status code
    res.status(dottie.get(resp, 'statusCode', 502));
    // Replicate the Apache handler's cookie header
    if (dottie.get(resp, 'headers.set-cookie')) {
      res.set('Set-Cookie', resp.headers['set-cookie']);
    }
    res.send({});
  });
}

export default handler;
