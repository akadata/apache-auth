import extend from 'deep-extend';
import u2f from 'u2f';

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

    console.log(doc.registerRequest);
    console.log(data.registerResponse);

    const result = u2f.checkRegistration(doc.registerRequest, data.registerResponse);

    if (result.successful) {
      return ctx.db.users.update({username: data.username}, extend(doc, {
        keyHandle: result.keyHandle,
        publicKey: result.publicKey
      }), () => res.success({publicKey: result.publicKey}));
    }

    return res.error(400, result.errorMessage || 'There was an unknown error.');
  });
}

export default handler;
