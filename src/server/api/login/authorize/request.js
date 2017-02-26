/* global setTimeout */

import extend from 'deep-extend';
import humanize from 'humanize';

/**
 * Initialize an authorization request.
 *
 * @param {Object} ctx Server-side application context
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
function handler(ctx, req, res) {
  const data = extend({
    fingerprint: '',
    scope: ''
  }, req.body);

  if (!data.fingerprint) {
    return res.error(400, 'Browser fingerprint must be supplied.');
  }

  if (!data.scope) {
    return res.error(400, 'Valid domain scope must be supplied.');
  }

  return ctx.db.authorizations.insert({
    timestamp: Date.now(),
    expiry: Date.now() + 5 * 60 * 1000,
    fingerprint: data.fingerprint,
    ip: req.remoteIP,
    userAgent: req.header('user-agent'),
    scope: data.scope
  }, (err, doc) => {
    if (err) {
      return res.error(500, 'Server-side database error; please try again.');
    }

    const msg = [
      'New temporary authorization request.\n',
      `IP: ${doc.ip}`,
      `User agent: ${doc.userAgent}`,
      `Scope: ${doc.scope}`,
      `Expires: ${humanize.date('g:i:s A', doc.expiry / 1000)}`
    ].join('\n');
    const buttons = [
      {
        title: 'View details',
        url: `https://auth.kevinlin.info/admin/authorize/${doc._id}`
      }
    ];

    // Automatically expire this authorization request after 5 minutes
    setTimeout(() => ctx.db.authorizations.remove({_id: doc._id}), 5 * 60 * 1000);

    return ctx.allu.template('Auth', msg, buttons, () => res.success({authorizationID: doc._id}));
  });
}

export default handler;
