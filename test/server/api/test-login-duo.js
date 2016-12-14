import duo from 'duo_web';
import sinon from 'sinon';
import test from 'tape';

import authenticate from '../../../src/server/api/authenticate';
import contextFactory from '../../util/context-factory';
import handler from '../../../src/server/api/login-duo';
import secrets from '../../../config/secrets';

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

test('Response for invalid authentication', (t) => {
  const authenticateStub = sinon.stub(authenticate, 'check', (username, password, cb) => {
    cb(null, {
      statusCode: 403
    });
  });
  const duoStub = sinon.stub(duo, 'sign_request', () => 'sigrequest');
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
      username: 'username',
      password: 'password'
    }
  };

  handler(mockCtx, mockReq, mockRes);
  t.ok(authenticateStub.called, 'Attempt to authenticate the user');
  t.notOk(duoStub.called, 'No attempt to sign the Duo request');
  t.ok(mockRes.status.calledWith(401), 'Response code from Apache is replicated');
  t.ok(mockRes.send.calledWith({
    success: false,
    message: 'The username/password combination is incorrect.'
  }), 'JSON response is correct');
  t.equal(mockCtx.blacklist.getEntries()['127.0.0.1'].count, 1, 'Counter for IP blacklist incremented');

  authenticate.check.restore();
  duo.sign_request.restore();
  t.end();
});

test('Response for valid authentication', (t) => {
  const authenticateStub = sinon.stub(authenticate, 'check', (username, password, cb) => {
    cb(null, {
      statusCode: 200
    });
  });
  const duoStub = sinon.stub(duo, 'sign_request', () => 'sigrequest');
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
      username: 'username',
      password: 'password'
    }
  };

  handler(mockCtx, mockReq, mockRes);
  t.ok(authenticateStub.called, 'Attempt to authenticate the user');
  t.ok(duoStub.called, 'Attempt to sign the Duo request');
  t.ok(mockRes.status.calledWith(200), 'Response code from Apache is replicated');
  t.ok(mockRes.send.calledWith({
    success: true,
    message: null,
    sigRequest: 'sigrequest',
    duoHost: secrets.DUO_HOST
  }), 'JSON response is correct');

  authenticate.check.restore();
  duo.sign_request.restore();
  t.end();
});
