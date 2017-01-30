import extend from 'deep-extend';
import u2f from 'u2f';

/**
 * Validate the client-side provided challenge response, and add the user's security key to the
 * database as appropriate.
 *
 * @param {Object} ctx Server-side application context
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
function handler(ctx, req, res) {
  const data = extend({
    username: '',
    registerResponse: null
  }, req.body);

  if (!data.username) {
    return res.error(400, 'A username must be associated with this U2F registration request.');
  }

  if (!data.registerResponse) {
    return res.error(400, 'Registration response must be supplied.');
  }

  return ctx.db.users.findOne({username: data.username}, (err, doc) => {
    if (err || !doc) {
      return res.error(404, 'Specified username does not exist in the users database.');
    }

    const result = u2f.checkRegistration(doc.registerRequest, data.registerResponse);

    if (result.successful) {
      return ctx.db.users.update({username: data.username}, extend(doc, {
        keyHandle: result.keyHandle,
        publicKey: result.publicKey
      }), () => res.success());
    }

    return res.error(401, result.errorMessage || 'There was an unknown error.');
  });
}

export default handler;
