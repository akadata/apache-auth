import dottie from 'dottie';
import extend from 'deep-extend';
import u2f from 'u2f';

import authenticate from '../../../util/authenticate';

function handler(ctx, req, res) {
  const data = extend({
    authResponse: null,
    fingerprint: ''
  }, req.body);

  if (!data.fingerprint) {
    return res.error(400, 'Client fingerprint must be supplied.');
  }

  if (!data.authResponse) {
    return res.error(400, 'Auth response must be supplied.');
  }

  return ctx.db.fingerprints.findOne({fingerprint: data.fingerprint}, (fingerprintErr, {username, authRequest}) => {
    if (fingerprintErr || !authRequest) {
      return res.error(404, 'No authentication request with the specified fingerprint is in progress.');
    }

    return ctx.db.users.findOne({username}, (userErr, {username, password, publicKey}) => {
      if (userErr || !publicKey) {
        return res.error(404, 'The associated user has no associated security key.');
      }

      const authResult = u2f.checkSignature(authRequest, data.authResponse, publicKey);

      if (!authResult.successful) {
        return res.error(500, 'There was an error validating the authentication token.', authResult);
      }

      return authenticate.check(username, password, onApacheAuthentication);
    });
  });

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
