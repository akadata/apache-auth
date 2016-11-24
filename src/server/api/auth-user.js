import request from 'request';

import secrets from '../../../config/secrets';

/**
 * TODO
 *
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
function authUser(req, res) {
  console.log(req.body);
  request.post({
    url: 'https://auth.kevinlin.info/dologin.html',
    formData: {
      /* eslint-disable camelcase */
      httpd_username: req.body.username,
      httpd_password: req.body.password
      /* eslint-enable camelcase */
    }
  }, (err, resp, body) => {
    console.log(err);
    console.log(resp);
    console.log(body);
  });
}

export default authUser;
