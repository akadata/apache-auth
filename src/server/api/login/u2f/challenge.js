import extend from 'deep-extend';
import u2f from 'u2f';

import config from '../../../../../config/common';

/**
 * Issue a challenge for a request to authenticate for a user identified by a browser fingerprint.
 *
 * @param {Object} ctx Server-side application context
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
function handler(ctx, req, res) {
  const data = extend({
    fingerprint: ''
  }, req.body);

  if (!data.fingerprint) {
    return res.error(400, 'Browser fingerprint must be supplied.');
  }

  return ctx.db.fingerprints.findOne({fingerprint: data.fingerprint}, onFingerprintLookup);

  function onFingerprintLookup(err, doc) {
    if (err || !doc) {
      return res.error(404, 'The requested fingerprint has no associated username.');
    }

    return ctx.db.users.findOne({username: doc.username}, onUserLookup);
  }

  function onUserLookup(err, user) {
    if (err || !user) {
      return res.error(404, 'The fingerprint\'s associated username does not exist.');
    }

    if (!user.keyHandle) {
      return res.error(404, 'The associated user has no security key registered.');
    }

    const authRequest = u2f.request(config.app.url, user.keyHandle);

    return ctx.db.fingerprints.update({fingerprint: data.fingerprint}, {$set: {authRequest}},
      () => res.success(authRequest));
  }
}

export default handler;
