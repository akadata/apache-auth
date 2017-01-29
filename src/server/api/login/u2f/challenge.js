import extend from 'deep-extend';
import u2f from 'u2f';

import config from '../../../../../config/common';

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
      return res.error(404, 'The associated user has no security key registered.');
    }

    const authRequest = u2f.request(config.app.url, user.keyHandle);

    return ctx.db.fingerprints.update({fingerprint: data.fingerprint}, {$set: {authRequest}},
      () => res.success(authRequest));
  }
}

export default handler;
