/**
 * List all users with registered security keys.
 *
 * @param {Object} ctx Server-side application context
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
function handler(ctx, req, res) {
  return ctx.db.users.find({}, (err, users) => {
    if (err) {
      return res.error();
    }

    return res.success({
      users: users.filter((user) => user.keyHandle).map((user) => user.username)
    });
  });
}

export default handler;
