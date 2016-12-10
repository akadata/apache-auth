import config from '../../../config/common';

/**
 * Retrieve all server-side known blacklist entries.
 *
 * @param {Object} ctx Server-side application context
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
function handler(ctx, req, res) {
  // The entries below are populated according to the shape {ip: {count: ..., timestamp: ...}}.
  // Some reformatting needs to be done to tell the client about expiry times and whether the entry
  // is actually blacklisted, so that the client can consume it with minimal logic overhead.
  const blacklistEntries = ctx.blacklist.getEntries();

  const entriesArr = Object.keys(blacklistEntries).map((ip) => ({
    ip,
    expiry: Math.round((blacklistEntries[ip].timestamp + config.blacklist.TTL) / 1000),
    isBlacklisted: blacklistEntries[ip].count >= config.blacklist.maxFailedAttempts,
    ...blacklistEntries[ip]
  }));

  return res.send({
    success: true,
    message: null,
    entries: entriesArr
  });
}

export default handler;
