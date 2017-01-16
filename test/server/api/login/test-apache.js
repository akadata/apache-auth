import duo from 'duo_web';
import sinon from 'sinon';
import test from 'tape';

import authenticate from '../../../../src/server/util/authenticate';
import contextFactory from '../../../util/context-factory';
import handler from '../../../../src/server/api/login/apache';

test('Missing Duo sig response', (t) => {
  const duoStub = sinon.stub(duo, 'verify_response');
  const mockReq = {};
  const mockRes = {
    error: sinon.spy()
  };

  handler(null, mockReq, mockRes);

  const expectMsg = 'The 2FA validation from Duo was not supplied. Please try the login again.';
  t.ok(mockRes.error.calledWith(400, expectMsg), 'HTTP 400 is returned');
  t.notOk(duoStub.called, 'No attempt to verify response with Duo');

  duo.verify_response.restore();
  t.end();
});

test('Missing username and/or password', (t) => {
  const duoStub = sinon.stub(duo, 'verify_response');
  const mockReq = {
    body: {
      sigResponse: 'sig response'
    }
  };
  const mockRes = {
    error: sinon.spy()
  };

  handler(null, mockReq, mockRes);

  const expectMsg = 'The username and password was not supplied. Please try the login again.';
  t.ok(mockRes.error.calledWith(400, expectMsg), 'HTTP 400 is returned');
  t.notOk(duoStub.called, 'No attempt to verify response with Duo');

  duo.verify_response.restore();
  t.end();
});

test('Response for invalid 2FA response from Duo', (t) => {
  const authenticateStub = sinon.stub(authenticate, 'check');
  const duoStub = sinon.stub(duo, 'verify_response', () => false);
  const mockCtx = contextFactory.create();
  const mockRes = {
    error: sinon.spy()
  };
  const mockReq = {
    body: {
      username: 'username',
      password: 'password',
      sigResponse: 'sig response'
    }
  };

  handler(mockCtx, mockReq, mockRes);

  t.ok(duoStub.called, 'Attempt to verify the 2FA Duo response');
  t.notOk(authenticateStub.called, 'No attempt to authenticate the user');
  t.ok(mockRes.error.calledWith(401, 'The Duo 2FA response could not be validated.'),
    'Returns HTTP 401');

  authenticate.check.restore();
  duo.verify_response.restore();
  t.end();
});

test('Response for valid 2FA response from Duo', (t) => {
  const authenticateStub = sinon.stub(authenticate, 'check', (username, password, cb) => {
    cb(null, {
      statusCode: 200,
      headers: {
        'set-cookie': 'cookie'
      }
    });
  });
  const duoStub = sinon.stub(duo, 'verify_response', () => true);
  const mockCtx = contextFactory.create();
  const mockRes = {
    status: sinon.spy(),
    send: sinon.spy(),
    set: sinon.spy()
  };
  const mockReq = {
    body: {
      username: 'username',
      password: 'password',
      sigResponse: 'sig response'
    }
  };

  handler(mockCtx, mockReq, mockRes);

  t.ok(duoStub.called, 'Attempt to verify the 2FA Duo response');
  t.ok(authenticateStub.called, 'Attempt to authenticate the user');
  t.ok(mockRes.status.calledWith(200), 'Response code from Apache is replicated');
  t.ok(mockRes.set.calledWith('Set-Cookie', 'cookie'), 'Cookie header from Apache is replicated');
  t.ok(mockRes.send.calledWith({}), 'JSON response is correct');

  authenticate.check.restore();
  duo.verify_response.restore();
  t.end();
});

test('Response for invalid response from Apache', (t) => {
  const authenticateStub = sinon.stub(authenticate, 'check', (username, password, cb) => {
    cb(null);
  });
  const duoStub = sinon.stub(duo, 'verify_response', () => true);
  const mockCtx = contextFactory.create();
  const mockRes = {
    status: sinon.spy(),
    send: sinon.spy(),
    set: sinon.spy()
  };
  const mockReq = {
    body: {
      username: 'username',
      password: 'password',
      sigResponse: 'sig response'
    }
  };

  handler(mockCtx, mockReq, mockRes);

  t.ok(duoStub.called, 'Attempt to verify the 2FA Duo response');
  t.ok(authenticateStub.called, 'Attempt to authenticate the user');
  t.ok(mockRes.status.calledWith(502), 'Defaults to HTTP 502 on proxy error');
  t.notOk(mockRes.set.called, 'No attempt to set the headers on the response');
  t.ok(mockRes.send.calledWith({}), 'JSON response is correct');

  authenticate.check.restore();
  duo.verify_response.restore();
  t.end();
});
