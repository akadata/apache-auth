import request from 'request';
import sinon from 'sinon';
import test from 'tape';

import authenticate from '../../../src/server/util/authenticate';

test('Authentication request of correct shape', (t) => {
  const requestStub = sinon.stub(request, 'post', (opts, cb) => {
    t.equal(opts.url, 'https://auth.kevinlin.info/auth-login', 'Correct authentication endpoint');
    t.deepEqual(opts.form, {
      /* eslint-disable camelcase */
      httpd_username: 'username',
      httpd_password: 'password'
      /* eslint-enable camelcase */
    }, 'Form passed to endpoint is correct');

    cb();
  });

  authenticate.check('username', 'password', () => {
    t.ok(requestStub.called, 'Network request is made');

    request.post.restore();
    t.end();
  });
});
