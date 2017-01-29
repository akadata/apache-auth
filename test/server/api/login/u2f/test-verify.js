import sinon from 'sinon';
import test from 'tape';
import u2f from 'u2f';

import authenticate from '../../../../../src/server/util/authenticate';
import handler from '../../../../../src/server/api/login/u2f/verify';

test('Missing fingerprint', (t) => {
  const mockCtx = {};
  const mockReq = {};
  const mockRes = {
    error: sinon.spy()
  };

  handler(mockCtx, mockReq, mockRes);

  t.ok(mockRes.error.calledWith(400, 'Browser fingerprint must be supplied.'),
    'HTTP 400 on missing browser fingerprint');

  t.end();
});

test('Missing auth response', (t) => {
  const mockCtx = {};
  const mockReq = {
    body: {
      fingerprint: 'fingerprint'
    }
  };
  const mockRes = {
    error: sinon.spy()
  };

  handler(mockCtx, mockReq, mockRes);

  t.ok(mockRes.error.calledWith(400, 'Auth response must be supplied.'),
    'HTTP 400 on missing auth response');

  t.end();
});

test('Valid fingerprint, but no U2F currently in progress', (t) => {
  const mockCtx = {
    db: {
      fingerprints: {
        findOne: (opts, cb) => {
          t.equal(opts.fingerprint, 'fingerprint', 'Fingerprint is passed to DB query');

          return cb('error');
        }
      }
    }
  };
  const mockReq = {
    body: {
      fingerprint: 'fingerprint',
      authResponse: {}
    }
  };
  const mockRes = {
    error: sinon.spy()
  };

  handler(mockCtx, mockReq, mockRes);

  t.ok(mockRes.error.calledWith(404, 'No authentication request with the specified fingerprint ' +
    'is in progress.'), 'HTTP 404 on U2F auth with no initial challenge');

  t.end();
});

test('Valid fingerprint, but associated username does not exist', (t) => {
  const mockCtx = {
    db: {
      fingerprints: {
        findOne: (opts, cb) => {
          t.equal(opts.fingerprint, 'fingerprint', 'Fingerprint is passed to DB query');

          return cb(null, {username: 'username'});
        }
      },
      users: {
        findOne: (opts, cb) => {
          t.equal(opts.username, 'username', 'Username is passed from fingerprint lookup');

          return cb('error');
        }
      }
    }
  };
  const mockReq = {
    body: {
      fingerprint: 'fingerprint',
      authResponse: {}
    }
  };
  const mockRes = {
    error: sinon.spy()
  };

  handler(mockCtx, mockReq, mockRes);

  t.ok(mockRes.error.calledWith(404, 'The associated username does not exist.'),
    'HTTP 404 on U2F auth with no associated username');

  t.end();
});

test('Valid fingerprint, but associated user has no public key', (t) => {
  const mockCtx = {
    db: {
      fingerprints: {
        findOne: (opts, cb) => {
          t.equal(opts.fingerprint, 'fingerprint', 'Fingerprint is passed to DB query');

          return cb(null, {username: 'username'});
        }
      },
      users: {
        findOne: (opts, cb) => {
          t.equal(opts.username, 'username', 'Username is passed from fingerprint lookup');

          return cb(null, {});
        }
      }
    }
  };
  const mockReq = {
    body: {
      fingerprint: 'fingerprint',
      authResponse: {}
    }
  };
  const mockRes = {
    error: sinon.spy()
  };

  handler(mockCtx, mockReq, mockRes);

  t.ok(mockRes.error.calledWith(404, 'The associated user has no associated public key.'),
    'HTTP 404 on U2F auth with no associated user public key');

  t.end();
});

test('Unsuccessful U2F auth validation', (t) => {
  const u2fStub = sinon.stub(u2f, 'checkSignature').returns({successful: false});
  const mockCtx = {
    db: {
      fingerprints: {
        findOne: (opts, cb) => {
          t.equal(opts.fingerprint, 'fingerprint', 'Fingerprint is passed to DB query');

          return cb(null, {username: 'username', authRequest: 'auth request'});
        }
      },
      users: {
        findOne: (opts, cb) => {
          t.equal(opts.username, 'username', 'Username is passed from fingerprint lookup');

          return cb(null, {publicKey: 'public key'});
        }
      }
    }
  };
  const mockReq = {
    body: {
      fingerprint: 'fingerprint',
      authResponse: 'auth response'
    }
  };
  const mockRes = {
    error: sinon.spy()
  };

  handler(mockCtx, mockReq, mockRes);

  t.ok(u2fStub.calledWith('auth request', 'auth response', 'public key'),
    'Parameters passed to U2F authentication are correct');
  t.ok(mockRes.error.calledWith(500, 'There was an error validating the authentication token.'),
    'HTTP 500 on generic failed U2F authentication');

  u2f.checkSignature.restore();
  t.end();
});

test('Successful U2F auth validation', (t) => {
  const authenticateStub = sinon.stub(authenticate, 'check', (username, password, cb) => {
    t.equal(username, 'username', 'Username is passed from user DB query');
    t.equal(password, 'password', 'Password is passed from user DB query');

    return cb(null, {headers: {'set-cookie': 'cookie'}});
  });
  const u2fStub = sinon.stub(u2f, 'checkSignature').returns({successful: true});
  const mockCtx = {
    db: {
      fingerprints: {
        findOne: (opts, cb) => {
          t.equal(opts.fingerprint, 'fingerprint', 'Fingerprint is passed to DB query');

          return cb(null, {username: 'username', authRequest: 'auth request'});
        }
      },
      users: {
        findOne: (opts, cb) => {
          t.equal(opts.username, 'username', 'Username is passed from fingerprint lookup');

          return cb(null, {publicKey: 'public key', username: 'username', password: 'password'});
        }
      }
    }
  };
  const mockReq = {
    body: {
      fingerprint: 'fingerprint',
      authResponse: 'auth response'
    }
  };
  const mockRes = {
    success: sinon.spy(),
    status: sinon.spy(),
    set: sinon.spy()
  };

  handler(mockCtx, mockReq, mockRes);

  t.ok(u2fStub.calledWith('auth request', 'auth response', 'public key'),
    'Parameters passed to U2F authentication are correct');
  t.ok(authenticateStub.called, 'Apache authentication attempt is made');
  t.ok(mockRes.set.called, 'Response headers are set');
  t.ok(mockRes.status.called, 'Response status code is set');
  t.ok(mockRes.success.called, 'Success is returned');

  authenticate.check.restore();
  u2f.checkSignature.restore();
  t.end();
});
