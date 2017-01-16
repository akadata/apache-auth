import request from 'request';
import sinon from 'sinon';
import test from 'tape';

import handler from '../../../../src/server/api/logout/logout';

test('Logout replicates remote status code and cookie header', (t) => {
  const requestStub = sinon.stub(request, 'post', (opts, cb) => {
    t.equal(opts.url, 'https://auth.kevinlin.info/auth-logout', 'Correct authentication endpoint');
    t.equal(opts.headers.Cookie, 'cookie', 'Cookie is passed to server-side request');

    cb(null, {
      statusCode: 200,
      headers: {
        'set-cookie': 'resp-cookie'
      }
    });
  });

  const mockReq = {
    headers: {
      cookie: 'cookie'
    }
  };
  const mockRes = {
    status: sinon.spy(),
    set: sinon.spy(),
    send: sinon.spy()
  };

  handler(null, mockReq, mockRes);
  t.ok(requestStub.called, 'Network request is made');
  t.ok(mockRes.status.calledWith(200), 'Apache status code is replicated to client');
  t.ok(mockRes.set.calledWith('Set-Cookie', 'resp-cookie'),
    'Apache cookie is replicated to client');
  t.ok(mockRes.send.calledWith({}), 'JSON response is correct');

  request.post.restore();
  t.end();
});
