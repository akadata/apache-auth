import Allu from 'allu-client';
import Datastore from 'nedb';
import dottie from 'dottie';
import LRU from 'lru-cache';
import optional from 'optional';
import path from 'path';
import range from 'range';

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
   * Add a new entry to the blacklist.
   *
   * @param {String} ip Client IP address
   */
  function add(ip) {
    range.range(config.blacklist.maxFailedAttempts).forEach(increment.bind(null, ip));
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
    add,
    remove,
    isBlacklisted,
    getEntries
  };
};

/**
 * Initialize the server-side client for dispatching notifications with Allu.
 *
 * @returns {Object} An instantiated Allu client object.
 */
Context.prototype.initAllu = function initAllu() {
  return new Allu('EMPTY');
};

/**
 * Initialize the server-side, on-disk datastore.
 *
 * @returns {Object} Object containing properties fingerprints and users, each a different
 *                   datastore.
 */
Context.prototype.initDB = function initDB() {
  const createDatastore = (name) => new Datastore({
    filename: path.resolve(__dirname, `../../db/${name}`),
    autoload: true
  });

  const authorizations = createDatastore('authorizations');
  const fingerprints = createDatastore('fingerprints');
  const users = createDatastore('users');

  return {authorizations, fingerprints, users};
};

/**
 * Initialize the Yubikey validator client.
 *
 * @returns {Object} Yubikey validation client.
 */
Context.prototype.initYubikeyValidator = function initYubikeyValidator() {
  const YubikeyValidator = optional('yubikey-validator');
  return YubikeyValidator && new YubikeyValidator(secrets.YUBIKEY_AES_KEY, secrets.YUBIKEY_UID,
    secrets.YUBIKEY_API_CLIENT_ID, secrets.YUBIKEY_API_SECRET_KEY);
};

export default Context;
