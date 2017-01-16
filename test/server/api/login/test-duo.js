import duo from 'duo_web';
import sinon from 'sinon';
import test from 'tape';

import authenticate from '../../../../src/server/util/authenticate';
import contextFactory from '../../../util/context-factory';
import handler from '../../../../src/server/api/login/duo';
import secrets from '../../../../config/secrets';

test('Missing username or password', (t) => {
  const authenticateStub = sinon.stub(authenticate, 'check');
  const mockReq = {
    body: {
      username: '',
      password: ''
    }
  };
  const mockRes = {
    error: sinon.spy()
  };

  handler(null, mockReq, mockRes);

  t.ok(mockRes.error.calledWith(400, 'Both username and password must be supplied.'),
    'HTTP 400 is returned with invalid form error');
  t.notOk(authenticateStub.called, 'No attempt to authenticate against Apache');

  authenticate.check.restore();
  t.end();
});

test('Response for invalid authentication', (t) => {
  const authenticateStub = sinon.stub(authenticate, 'check', (username, password, cb) => {
    return cb(null, {statusCode: 403});
  });
  const duoStub = sinon.stub(duo, 'sign_request', () => 'sigrequest');
  const mockCtx = contextFactory.create();
  const mockRes = {
    error: sinon.spy()
  };
  const mockReq = {
    body: {
      username: 'username',
      password: 'password'
    },
    remoteIP: '127.0.0.1'
  };

  handler(mockCtx, mockReq, mockRes);

  t.ok(authenticateStub.called, 'Attempt to authenticate the user');
  t.notOk(duoStub.called, 'No attempt to sign the Duo request');
  t.ok(mockRes.error.calledWith(401, 'The username/password combination is incorrect.'),
    'HTTP 401 with message about invalid credentials');
  t.equal(mockCtx.blacklist.getEntries()['127.0.0.1'].count, 1,
    'Counter for IP blacklist incremented');

  authenticate.check.restore();
  duo.sign_request.restore();
  t.end();
});

test('Response for valid authentication', (t) => {
  const authenticateStub = sinon.stub(authenticate, 'check', (username, password, cb) => {
    return cb(null, {statusCode: 200});
  });
  const duoStub = sinon.stub(duo, 'sign_request', () => 'sigrequest');
  const mockCtx = contextFactory.create();
  const mockRes = {
    error: sinon.spy(),
    success: sinon.spy()
  };
  const mockReq = {
    body: {
      username: 'username',
      password: 'password'
    }
  };

  handler(mockCtx, mockReq, mockRes);

  t.ok(authenticateStub.called, 'Attempt to authenticate the user');
  t.ok(duoStub.called, 'Attempt to sign the Duo request');
  t.ok(mockRes.success.calledWith({sigRequest: 'sigrequest', duoHost: secrets.DUO_HOST}),
    'Success response data is passed to client');
  t.notOk(mockRes.error.called, 'No error is created');

  authenticate.check.restore();
  duo.sign_request.restore();
  t.end();
});
