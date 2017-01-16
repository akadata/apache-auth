import dottie from 'dottie';

/**
 * Check if a browser fingerprint is trusted.
 *
 * @param {Object} ctx Server-side application context
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
function handler(ctx, req, res) {
  return ctx.db.fingerprints.find({
    fingerprint: dottie.get(req, 'body.fingerprint')
  }, (err, docs) => {
    if (err) {
      return res.error();
    }

    if (!docs.length) {
      return res.error(404, 'This browser fingerprint is not trusted.');
    }

    return res.success();
  });
}

export default handler;
