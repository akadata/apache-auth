import sinon from 'sinon';
import test from 'tape';
import u2f from 'u2f';

import handler from '../../../../../src/server/api/admin/u2f/register-verify';

test('Missing username in registration verification', (t) => {
  const mockCtx = {};
  const mockReq = {};
  const mockRes = {
    error: sinon.spy(),
    success: sinon.spy()
  };

  handler(mockCtx, mockReq, mockRes);

  t.ok(mockRes.error.calledWith(400, 'A username must be associated with this U2F registration ' +
    'request.'), 'HTTP 400 with error about missing username');

  t.end();
});

test('Missing registration response in registration verification', (t) => {
  const mockCtx = {};
  const mockReq = {
    body: {
      username: 'username'
    }
  };
  const mockRes = {
    error: sinon.spy(),
    success: sinon.spy()
  };

  handler(mockCtx, mockReq, mockRes);

  t.ok(mockRes.error.calledWith(400, 'Registration response must be supplied.'),
    'HTTP 400 with error about missing registration response');

  t.end();
});

test('Nonexistent user on registration verification', (t) => {
  const mockCtx = {
    db: {
      users: {
        findOne: (opts, cb) => {
          t.equal(opts.username, 'username', 'Username is passed to user lookup query');

          return cb('error');
        }
      }
    }
  };
  const mockReq = {
    body: {
      username: 'username',
      registerResponse: 'register response'
    }
  };
  const mockRes = {
    error: sinon.spy(),
    success: sinon.spy()
  };

  handler(mockCtx, mockReq, mockRes);

  t.ok(mockRes.error.calledWith(404, 'Specified username does not exist in the users database.'),
    'HTTP 404 on nonexistent username in registration validation');

  t.end();
});

test('Failed registration verification for user', (t) => {
  const checkRegistrationStub = sinon.stub(u2f, 'checkRegistration').returns({successful: false});
  const mockCtx = {
    db: {
      users: {
        findOne: (opts, cb) => {
          t.equal(opts.username, 'username', 'Username is passed to user lookup query');

          return cb(null, {});
        }
      }
    }
  };
  const mockReq = {
    body: {
      username: 'username',
      registerResponse: 'register response'
    }
  };
  const mockRes = {
    error: sinon.spy(),
    success: sinon.spy()
  };

  handler(mockCtx, mockReq, mockRes);

  t.ok(mockRes.error.calledWith(401, 'There was an unknown error.'),
    'HTTP 401 on invalid registration');
  t.ok(checkRegistrationStub.called, 'Attempt to validate registration');

  u2f.checkRegistration.restore();
  t.end();
});

test('Successful registration verification for user', (t) => {
  const checkRegistrationStub = sinon.stub(u2f, 'checkRegistration').returns({
    successful: true,
    keyHandle: 'key handle',
    publicKey: 'public key'
  });
  const mockCtx = {
    db: {
      users: {
        findOne: (opts, cb) => {
          t.equal(opts.username, 'username', 'Username is passed to user lookup query');

          return cb(null, {});
        },
        update: (opts, update, cb) => {
          t.equal(opts.username, 'username', 'Username is passed to update user query');
          t.deepEqual(update, {
            keyHandle: 'key handle',
            publicKey: 'public key'
          }, 'Key handle and public key is stored in the database');

          return cb();
        }
      }
    }
  };
  const mockReq = {
    body: {
      username: 'username',
      registerResponse: 'register response'
    }
  };
  const mockRes = {
    error: sinon.spy(),
    success: sinon.spy()
  };

  handler(mockCtx, mockReq, mockRes);

  t.ok(mockRes.success.called, 'Registration is successful');
  t.ok(checkRegistrationStub.called, 'Attempt to validate registration');

  u2f.checkRegistration.restore();
  t.end();
});
