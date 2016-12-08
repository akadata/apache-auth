import duo from 'duo_web';

import secrets from '../../../config/secrets';

/**
 * Attempt to log the user in.
 *
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
function handler(req, res) {
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
}

export default handler;
