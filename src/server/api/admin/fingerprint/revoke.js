import dottie from 'dottie';

/**
 * Add a new trusted browser fingerprint.
 *
 * @param {Object} ctx Server-side application context
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
function handler(ctx, req, res) {
  const id = dottie.get(req, 'body.id');

  if (!id) {
    return res.error(400, 'You must specify the ID of the fingerprint to revoke.');
  }

  return ctx.db.fingerprints.remove({_id: id}, (err) => err ? res.error() : res.success());
}

export default handler;
