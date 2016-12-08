import duo from 'duo_web';

import authenticate from './authenticate';
import secrets from '../../../config/secrets';

/**
 * Attempt to log the user in.
 *
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
function handler(req, res) {
  // Validate the correctness of the provided credentials
  authenticate(req.body.username, req.body.password, (err, resp) => {
    if (err || (resp.statusCode !== 200)) {
      return res.status(401).send({
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

    return res.send({
      success: true,
      message: null,
      sigRequest,
      duoHost: secrets.DUO_HOST
    });
  });
}

export default handler;
