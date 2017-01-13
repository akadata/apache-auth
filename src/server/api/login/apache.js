import extend from 'deep-extend';
import dottie from 'dottie';
import duo from 'duo_web';

import authenticate from '../../util/authenticate';
import secrets from '../../../../config/secrets';

/**
 * Attempt to log the user in.
 *
 * @param {Object} ctx Server-side application context
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
function handler(ctx, req, res) {
  const data = extend({
    sigResponse: '',
    username: '',
    password: ''
  }, req.body);

  if (!data.sigResponse) {
    return res.error(400, 'The 2FA validation from Duo was not supplied. Please try the login again.');
  }

  if (!data.username || !data.password) {
    return res.error(400, 'The username and password was not supplied. Please try the login again.');
  }

  // Verify the 2FA response from Duo
  if (!duo.verify_response(secrets.DUO_IKEY, secrets.DUO_SKEY, secrets.DUO_AKEY, req.body.sigResponse)) {
    return res.error(401, 'The Duo 2FA response could not be validated.');
  }

  // Then, authenticate against Apache one more time, setting the client cookie
  return authenticate.check(data.username, data.password, (_, resp) => {
    // Replicate the Apache handler's status code
    res.status(dottie.get(resp, 'statusCode', 502));
    // Replicate the Apache handler's cookie header
    if (dottie.get(resp, 'headers.set-cookie')) {
      res.set('Set-Cookie', resp.headers['set-cookie']);
    }
    return res.send({});
  });
}

export default handler;
