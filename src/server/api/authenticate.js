import request from 'request';

/**
 * Authenticate the provided username-password pair against the Apache server.
 *
 * @param username Username to attempt to authenticate.
 * @param password The corresponding password.
 * @param cb Request callback on completion of authentication attempt.
 */
function check(username, password, cb) {
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

const authenticate = {
  check
};

export default authenticate;
