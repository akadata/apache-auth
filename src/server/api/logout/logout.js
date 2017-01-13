import dottie from 'dottie';
import request from 'request';

/**
 * Attempt to log the user out.
 *
 * @param {Object} ctx Server-side application context
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
function handler(ctx, req, res) {
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
    return res.send({});
  });
}

export default handler;
