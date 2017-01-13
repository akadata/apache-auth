import extend from 'deep-extend';

/**
 * Add a new trusted browser fingerprint.
 *
 * @param {Object} ctx Server-side application context
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
function handler(ctx, req, res) {
  const data = extend({
    name: '',
    fingerprint: ''
  }, req.body);

  if (!data.name || !data.fingerprint) {
    return res.error(400, 'You must specify both the name and fingerprint.');
  }

  return ctx.db.fingerprints.insert(data, (err) => err ? res.error() : res.success());
}

export default handler;
