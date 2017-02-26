import extend from 'deep-extend';

/**
 * Blacklist the IP associated with an authorization request.
 *
 * @param {Object} ctx Server-side application context
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
function handler(ctx, req, res) {
  const data = extend({
    authorizationID: null
  }, req.body);

  if (!data.authorizationID) {
    return res.error(400, 'Authorization ID must be supplied.');
  }

  return ctx.db.authorizations.findOne({_id: data.authorizationID}, (err, doc) => {
    if (err || !doc) {
      return res.error(404, 'No such authorization request exists.');
    }

    ctx.blacklist.add(doc.ip);

    return res.success();
  });
}

export default handler;
