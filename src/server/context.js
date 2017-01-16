import Datastore from 'nedb';
import dottie from 'dottie';
import LRU from 'lru-cache';
import optional from 'optional';
import path from 'path';

import config from '../../config/common';
import secrets from '../../config/secrets';

/**
 * Initialize the server-side application context, where each property is an object with functions
 * allowing for modification of some component of universal server-side state.
 *
 * @returns {Object} Object of context properties.
 * @constructor
 */
function Context() {
  this.blacklist = this.initBlacklistCache();
  this.allu = this.initAllu();
  this.db = this.initDB();
  this.yubikey = this.initYubikeyValidator();
}

/**
 * Initialize the blacklist cache.
 *
 * @returns {Object} Object containing functions to modify the blacklist cache.
 */
Context.prototype.initBlacklistCache = function initBlacklistCache() {
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
      const details = cache.peek(ip);
      if (details) {
        entries[ip] = details;
      }
      return entries;
    }, {});
  }

  return {
    increment,
    remove,
    isBlacklisted,
    getEntries
  };
};

/**
 * Initialize the server-side client for dispatching notifications with Allu.
 *
 * @returns {Object} An instantiated Allu client object, or null if the allu-client dependency
 *                   is unable to be fulfilled.
 */
Context.prototype.initAllu = function initAllu() {
  const Allu = optional('allu-client');
  return Allu && new Allu('EMPTY');
};

/**
 * TODO
 *
 * @returns {{fingerprints}}
 */
Context.prototype.initDB = function initDB() {
  const fingerprints = new Datastore({
    filename: path.resolve(__dirname, '../../db/fingerprints'),
    autoload: true
  });
  const users = new Datastore({
    filename: path.resolve(__dirname, '../../db/users'),
    autoload: true
  });

  return {fingerprints, users};
};

/**
 * TODO
 *
 * @returns {*}
 */
Context.prototype.initYubikeyValidator = function initYubikeyValidator() {
  const YubikeyValidator = optional('yubikey-validator');
  return YubikeyValidator && new YubikeyValidator(secrets.YUBIKEY_AES_KEY, secrets.YUBIKEY_UID,
    secrets.YUBIKEY_API_CLIENT_ID, secrets.YUBIKEY_API_SECRET_KEY);
};

export default Context;
