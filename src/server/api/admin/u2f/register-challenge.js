import extend from 'deep-extend';
import u2f from 'u2f';

import config from '../../../../../config/common';

/**
 * Issue a challenge for a request to register a new security key.
 *
 * @param {Object} ctx Server-side application context
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
function handler(ctx, req, res) {
  const data = extend({
    username: ''
  }, req.body);

  if (!data.username) {
    return res.error(400, 'A username must be associated with this U2F registration request.');
  }

  return ctx.db.users.findOne({username: data.username}, (err, doc) => {
    if (err || !doc) {
      return res.error(404, 'Specified username does not exist in the users database.');
    }

    const registerRequest = u2f.request(config.app.url);

    return ctx.db.users.update({username: data.username}, extend(doc, {registerRequest}),
      () => res.success(registerRequest));
  });
}

export default handler;
