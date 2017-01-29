import dottie from 'dottie';
import extend from 'deep-extend';
import u2f from 'u2f';

import authenticate from '../../../util/authenticate';

/**
 * Validate the client-side provided authentication challenge response, and request an HTTP session
 * cookie (proxied to the client) on success.
 *
 * @param {Object} ctx Server-side application context
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
function handler(ctx, req, res) {
  const data = extend({
    authResponse: null,
    fingerprint: ''
  }, req.body);

  if (!data.fingerprint) {
    return res.error(400, 'Browser fingerprint must be supplied.');
  }

  if (!data.authResponse) {
    return res.error(400, 'Auth response must be supplied.');
  }

  return ctx.db.fingerprints.findOne({fingerprint: data.fingerprint}, onFingerprintLookup);

  function onFingerprintLookup(err, doc) {
    if (err || !doc) {
      return res.error(404, 'No authentication request with the specified fingerprint is in ' +
        'progress.');
    }

    return ctx.db.users.findOne({username: doc.username},
      (userErr, user) => onUserLookup(userErr, user, doc));
  }

  function onUserLookup(err, user, fingerprint) {
    if (err || !user) {
      return res.error(404, 'The associated username does not exist.');
    }

    if (!user.publicKey) {
      return res.error(404, 'The associated user has no associated public key.');
    }

    const authResult = u2f.checkSignature(fingerprint.authRequest, data.authResponse,
      user.publicKey);

    if (!authResult.successful) {
      return res.error(500, 'There was an error validating the authentication token.', authResult);
    }

    return authenticate.check(user.username, user.password, onApacheAuthentication);
  }

  function onApacheAuthentication(err, resp) {  // eslint-disable-line handle-callback-err
    // Replicate the Apache handler's status code
    res.status(dottie.get(resp, 'statusCode', 502));
    // Replicate the Apache handler's cookie header
    if (dottie.get(resp, 'headers.set-cookie')) {
      res.set('Set-Cookie', resp.headers['set-cookie']);
    }
    return res.success();
  }
}

export default handler;
