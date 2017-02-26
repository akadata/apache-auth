import extend from 'deep-extend';

/**
 * Check the status of an authorization request.
 *
 * @param {Object} ctx Server-side application context
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
function handler(ctx, req, res) {
  const data = extend({
    fingerprint: null,
    authorizationID: null
  }, req.body);

  if (!data.fingerprint) {
    return res.error(400, 'Browser fingerprint must be supplied.');
  }

  if (!data.authorizationID) {
    return res.error(400, 'Authorization ID must be supplied.');
  }

  return ctx.db.authorizations.findOne({_id: data.authorizationID}, onAuthorizationEntry);

  function onAuthorizationEntry(err, doc) {
    if (err || !doc) {
      return res.error(404, 'No authorization exists with this ID.');
    }

    if (doc.fingerprint !== data.fingerprint) {
      return res.error(403, 'Authorization ID mismatch with requesting client fingerprint.');
    }

    if (!doc.cookie) {
      return res.error(403, 'Request is not approved.');
    }

    return ctx.db.authorizations.remove({_id: data.authorizationID}, () => {
      res.set('Set-Cookie', doc.cookie);
      return res.success();
    });
  }
}

export default handler;
