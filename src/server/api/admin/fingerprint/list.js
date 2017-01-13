/**
 * Retrieve all server-side known browser fingerprints.
 *
 * @param {Object} ctx Server-side application context
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
function handler(ctx, req, res) {
  return ctx.db.fingerprints.find({}, (err, fingerprints) => {
    return err ? res.error() : res.success({fingerprints});
  });
}

export default handler;
