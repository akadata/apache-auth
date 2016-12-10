/**
 * Retrieve all server-side known blacklist entries.
 *
 * @param {Object} ctx Server-side application context
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
function handler(ctx, req, res) {
  return res.send({
    success: true,
    entries: ctx.blacklist.getEntries()
  });
}

export default handler;
