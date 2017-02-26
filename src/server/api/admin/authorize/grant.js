import dottie from 'dottie';
import extend from 'deep-extend';

import authenticate from '../../../util/authenticate';

/**
 * Grant authorization for a particular request.
 *
 * @param {Object} ctx Server-side application context
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
function handler(ctx, req, res) {
  const data = extend({
    authorizationID: null,
    username: null,
    duration: 30
  }, req.body);

  if (!data.username) {
    return res.error(400, 'Authorization username must be supplied.');
  }

  if (!data.authorizationID) {
    return res.error(400, 'Authorization ID must be supplied.');
  }

  return ctx.db.users.findOne({username: data.username}, onUser);

  function onUser(err, user) {
    if (err || !user) {
      return res.error(404, 'No user exists with this username.');
    }

    return ctx.db.authorizations.findOne({_id: data.authorizationID},
      onAuthorization.bind(null, user));
  }

  function onAuthorization(user, err, authorization) {
    if (err || !authorization) {
      return res.error(404, 'No such authorization request exists.');
    }

    if (authorization.expiry <= Date.now()) {
      return res.error(400, 'This request is past expiry, and cannot be approved.');
    }

    return authenticate.authRequest(user.username, user.password, data.duration,
      onAuthCheck.bind(null, authorization));
  }

  function onAuthCheck(authorization, err, resp) {
    if (err || resp.statusCode !== 200) {
      return res.error(500, 'There was an upstream error from the authentication server.');
    }

    const cookie = dottie.get(resp, 'headers.set-cookie', [''])[0];

    return ctx.db.authorizations.update({
      _id: data.authorizationID
    }, {
      $set: {cookie}
    }, () => res.success());
  }
}

export default handler;
