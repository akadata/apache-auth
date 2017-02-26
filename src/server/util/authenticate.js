import request from 'request';

/**
 * Authenticate the provided username-password pair against the Apache server.
 *
 * @param {String} username Username to attempt to authenticate.
 * @param {String} password The corresponding password.
 * @param {Function} cb Request callback on completion of authentication attempt.
 */
function check(username, password, cb = () => {}) {
  request.post({
    url: 'https://auth.kevinlin.info/auth-login',
    form: {
      /* eslint-disable camelcase */
      httpd_username: username,
      httpd_password: password
      /* eslint-enable camelcase */
    }
  }, cb);
}

/**
 * Authenticate the provided username-password pair specifically for limited-duration
 * authorization requests.
 *
 * @param {String} username Username to attempt to authenticate.
 * @param {String} password The corresponding password.
 * @param {Number} duration The desired session expiry, in minutes.
 * @param {Function} cb Request callback on completion of authentication attempt.
 */
function authRequest(username, password, duration, cb = () => {}) {
  const endpoint = {
    1: 'auth-request-short',
    30: 'auth-request-long'
  };

  request.post({
    url: `https://auth.kevinlin.info/${endpoint[duration] || endpoint[30]}`,
    form: {
      /* eslint-disable camelcase */
      httpd_username: username,
      httpd_password: password
      /* eslint-enable camelcase */
    }
  }, cb);
}

export default {check, authRequest};
