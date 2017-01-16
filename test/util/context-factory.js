import config from '../../config/common';
import Context from '../../src/server/context';
import range from 'range';

/**
 * Create an instance of Context with the given list of blacklisted IPs.
 *
 * @param {Array=} blacklistIPs Array of IPs to blacklist in the context.
 * @returns {Object} Initialized context object.
 */
function create(blacklistIPs) {
  const ctx = {
    blacklist: Context.prototype.initBlacklistCache(),
    db: {},
    yubikey: Context.prototype.initYubikeyValidator()
  };

  ctx.allu = {
    template: () => {}
  };

  range
    .range(0, config.blacklist.maxFailedAttempts + 1)
    .forEach(() => (blacklistIPs || []).forEach((ip) => ctx.blacklist.increment(ip)));

  return ctx;
}

const contextFactory = {
  create
};

export default contextFactory;
