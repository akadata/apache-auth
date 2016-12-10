import dottie from 'dottie';
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
      const existingCount = dottie.get(cache.get(ip.toString()), 'count', 0);
      cache.set(ip.toString(), {
        count: existingCount + 1,
        timestamp: Date.now()
      });
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
      const count = dottie.get(cache.peek(ip.toString()), 'count', 0);
      return count >= config.blacklist.maxFailedAttempts;
    }
    return false;
  }

  /**
   * Retrieve an object mapping of all blacklisted (or almost-blacklisted) IP addresses with the
   * number of failed attempts and the timestamp of the most recent failure.
   *
   * @returns {Object} Object mapping IP addresses to an object with keys "count" and "timestamp"
   */
  function getEntries() {
    return cache.keys().reduce((entries, ip) => {
      entries[ip] = cache.peek(ip);
      return entries;
    }, {});
  }

  return {
    increment,
    remove,
    isBlacklisted,
    getEntries
  };
}

export default Context;
