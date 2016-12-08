import dottie from 'dottie';
import request from 'request';

/**
 * Attempt to log the user out.
 *
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
function handler(req, res) {
  request.post({
    url: 'https://auth.kevinlin.info/auth-logout',
    headers: {
      Cookie: dottie.get(req, 'headers.cookie')
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
