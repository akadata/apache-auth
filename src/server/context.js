import LRU from 'lru-cache';

import config from '../../config/common';

/**
 * Initialize the server-side application context, where each property is an object with functions
 * allowing for modification of some component of universal server-side state.
 *
 * @returns {Object} Object of context properties.
 * @constructor
 */
function Context() {
  return {
    blacklist: initBlacklistCache()
  };
}

/**
 * Initialize the blacklist cache.
 *
 * @returns {Object} Object containing functions to modify the blacklist cache.
 */
function initBlacklistCache() {
  const cache = LRU({
    maxAge: config.blacklist.TTL
  });

  /**
   * Increment the number of times this IP address has failed a login attempt.
   * This will modify the expiry of the cache entry (each increment will refresh the expiry TTL).
   *
   * @param {String} ip Client IP address
   */
  function increment(ip) {
    if (ip) {
      cache.set(ip.toString(), (cache.get(ip.toString()) || 0) + 1);
    }
  }

  /**
   * Remove the specified IP address from the blacklist cache.
   *
   * @param {String} ip Client IP address
   */
  function remove(ip) {
    if (ip) {
      cache.del(ip.toString());
    }
  }

  /**
   * Check if the IP is blacklisted. This does not modify the expiry of the cache entry.
   *
   * @param {String} ip Client IP address
   * @returns {Boolean} True if the IP is blacklisted; false otherwise.
   */
  function isBlacklisted(ip) {
    if (ip) {
      return (cache.peek(ip.toString()) || 0) >= config.blacklist.maxFailedAttempts;
    }
    return false;
  }

  return {
    increment,
    remove,
    isBlacklisted
  };
}

export default Context;
