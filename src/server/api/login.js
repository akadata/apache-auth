import request from 'request';

/**
 * Attempt to log the user in.
 *
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
function handler(req, res) {
  request.post({
    url: 'https://auth.kevinlin.info/auth-login',
    form: {
      /* eslint-disable camelcase */
      httpd_username: req.body.username,
      httpd_password: req.body.password
      /* eslint-enable camelcase */
    }
  }, (err, resp) => {  // eslint-disable-line handle-callback-err
    // Replicate the Apache handler's status code
    res.status(resp.statusCode);
    // Replicate the Apache handler's cookie header
    res.set('Set-Cookie', resp.headers['set-cookie']);
    res.send(JSON.stringify({}));
  });
}

export default handler;
