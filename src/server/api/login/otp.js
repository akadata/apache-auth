import dottie from 'dottie';
import extend from 'deep-extend';

import authenticate from '../../util/authenticate';

/**
 * Attempt to log the user in via an OTP key. The server-side logic is a multistage process:
 * (1) Validate that the browser fingerprint is trusted
 * (2) Validate Yubikey UID and OTP validity (no replays)
 * (3) Find the user credentials associated with the Yubikey UID in the server-side datastore
 * (4) Dispatch a request to Apache to log the user in and proxy the response to the client
 *
 * @param {Object} ctx Server-side application context
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
function handler(ctx, req, res) {
  if (!ctx.yubikey) {
    return res.error(403, 'OTP logins are disabled on this server.');
  }

  const data = extend({
    fingerprint: '',
    otp: ''
  }, req.body);

  if (!data.fingerprint || !data.otp) {
    return res.error(400, 'Both fingerprint and OTP must be supplied.');
  }

  // Validate that the browser fingerprint is trusted
  return ctx.db.fingerprints.find({fingerprint: req.body.fingerprint}, onFingerprintValidation);

  function onFingerprintValidation(err, docs) {
    if (err || !docs.length) {
      return res.error(401, 'This browser is not authorized for OTP logins.');
    }

    // Validate the OTP and grab the decrypted Yubikey metadata
    return ctx.yubikey.validate(req.body.otp, onYubikeyValidation);
  }

  function onYubikeyValidation(err, decrypted) {
    if (err) {
      return res.error(401, 'The provided Yubikey OTP is invalid.');
    }

    // Fetch the user credentials associated with the Yubikey UID
    return ctx.db.users.findOne({yubikeyUID: decrypted.uid}, onUserUIDLookup);
  }

  function onUserUIDLookup(err, user) {
    if (err || !user) {
      return res.error(401, 'The provided Yubikey OTP UID has no associated user credentials.');
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
    return res.send({});
  }
}

export default handler;
