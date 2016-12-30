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

  // Validate the correctness of the provided credentials
  return authenticate.check(req.body.username, req.body.password, (err, resp) => {
    if (err || (resp.statusCode !== 200)) {
      // Increment the number of times a login from this IP address has failed
      ctx.blacklist.increment(ip);

      // Send a notification that a login attempt was unsuccessful
      if (ctx.allu) {
        ctx.allu.template('Auth',
          `Failed login attempt from ${ip} with username '${req.body.username}'.`, [{
            title: 'Track IP',
            url: `https://freegeoip.net/?q=${ip}`
          }]);
      }

      res.status(401);
      return res.send({
        success: false,
        message: 'The username/password combination is incorrect.'
      });
    }

    // Then, initialize a Duo 2FA transaction
    const sigRequest = duo.sign_request(
      secrets.DUO_IKEY,
      secrets.DUO_SKEY,
      secrets.DUO_AKEY,
      req.body.username
    );

    res.status(200);
    return res.send({
      success: true,
      message: null,
      sigRequest,
      duoHost: secrets.DUO_HOST
    });
  });
}

export default handler;
