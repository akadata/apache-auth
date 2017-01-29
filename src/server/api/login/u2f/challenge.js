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

  return ctx.db.fingerprints.findOne({fingerprint: data.fingerprint}, (fingerprintErr, {username}) => {
    if (fingerprintErr || !username) {
      return res.error(404, 'The requested fingerprint has no associated username.');
    }

    return ctx.db.users.findOne({username}, (userErr, {keyHandle}) => {
      if (userErr || !keyHandle) {
        return res.error(404, 'The associated user has no security key registered.');
      }

      const authRequest = u2f.request(config.app.url, keyHandle);

      return ctx.db.fingerprints.update({fingerprint: data.fingerprint}, {$set: {authRequest}},
        () => res.success(authRequest));
    });
  });
}

export default handler;
