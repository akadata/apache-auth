import duo from 'duo_web';
import sinon from 'sinon';
import test from 'tape';

import authenticate from '../../../src/server/util/authenticate';
import contextFactory from '../../util/context-factory';
import handler from '../../../src/server/api/login-apache';

test('Response for blacklisted IP', (t) => {
  const authenticateStub = sinon.stub(authenticate, 'check');
  const mockCtx = contextFactory.create(['127.0.0.1']);
  const mockRes = {
    status: sinon.spy(),
    send: sinon.spy()
  };
  const mockReq = {
    headers: {
      'x-forwarded-for': '127.0.0.1'
    }
  };

  handler(mockCtx, mockReq, mockRes);
  t.ok(mockRes.status.calledWith(403), 'Correct status code is set');
  t.ok(mockRes.send.calledWith({
    success: false,
    message: 'This IP address is blacklisted.'
  }), 'JSON response is correct');
  t.notOk(authenticateStub.called, 'No attempt to authenticate the user');

  authenticate.check.restore();
  t.end();
});

test('Response for invalid 2FA response from Duo', (t) => {
  const authenticateStub = sinon.stub(authenticate, 'check');
  const duoStub = sinon.stub(duo, 'verify_response', () => false);
  const mockCtx = contextFactory.create();
  const mockRes = {
    status: sinon.spy(),
    send: sinon.spy()
  };
  const mockReq = {
    headers: {
      'x-forwarded-for': '127.0.0.1'
    },
    body: {
      sigResponse: ''
    }
  };

  handler(mockCtx, mockReq, mockRes);
  t.ok(duoStub.called, 'Attempt to verify the 2FA Duo response');
  t.notOk(authenticateStub.called, 'No attempt to authenticate the user');
  t.ok(mockRes.status.calledWith(401), 'Correct status code is set');
  t.ok(mockRes.send.calledWith({
    success: false,
    message: 'Duo 2FA response could not be validated.'
  }), 'JSON response is correct');

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
    headers: {
      'x-forwarded-for': '127.0.0.1'
    },
    body: {
      sigResponse: ''
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
    headers: {
      'x-forwarded-for': '127.0.0.1'
    },
    body: {
      sigResponse: ''
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
