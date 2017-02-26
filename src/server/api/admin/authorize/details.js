import extend from 'deep-extend';

/**
 * Retrieve details about an authorization request.
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
    return res.error(400, 'Must supply authorization ID.');
  }

  return ctx.db.authorizations.findOne({_id: data.authorizationID}, (err, details) => {
    if (err || !details) {
      return res.error(404, 'No such authorization request exists.');
    }

    return res.success({details});
  });
}

export default handler;
