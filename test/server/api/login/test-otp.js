import sinon from 'sinon';
import test from 'tape';

import authenticate from '../../../../src/server/util/authenticate';
import handler from '../../../../src/server/api/login/otp';

test('Disabled OTP logins', (t) => {
  const mockCtx = {};
  const mockRes = {
    error: sinon.spy()
  };

  handler(mockCtx, null, mockRes);

  t.ok(mockRes.error.calledWith(403, 'OTP logins are disabled on this server.'),
    'HTTP 403 with error about disabled OTP logins');

  t.end();
});

test('Missing fingerprint or OTP', (t) => {
  const mockCtx = {
    yubikey: 'not null'
  };
  const mockReq = {
    body: {}
  };
  const mockRes = {
    error: sinon.spy()
  };

  handler(mockCtx, mockReq, mockRes);

  t.ok(mockRes.error.calledWith(400, 'Both fingerprint and OTP must be supplied.'),
    'HTTP 400 with error about missing fingerprint/OTP');

  t.end();
});

test('Browser fingerprint validation failure', (t) => {
  const mockCtx = {
    yubikey: 'not null',
    db: {
      fingerprints: {
        find: (opts, cb) => {
          t.equal(opts.fingerprint, 'fingerprint', 'Fingerprint is passed to database as query');
          return cb('error');
        }
      }
    }
  };
  const mockReq = {
    body: {
      fingerprint: 'fingerprint',
      otp: 'otp'
    }
  };
  const mockRes = {
    error: sinon.spy()
  };

  handler(mockCtx, mockReq, mockRes);

  t.ok(mockRes.error.calledWith(401, 'This browser is not authorized for OTP logins.'),
    'HTTP 401 with error about unauthorized fingerprint');

  t.end();
});

test('Valid browser fingerprint, thrown error on Yubikey validation', (t) => {
  const mockCtx = {
    yubikey: {
      validate: (otp) => {
        t.equal(otp, 'otp', 'OTP is passed to Yubikey validator');
        throw new Error('');
      }
    },
    db: {
      fingerprints: {
        find: (opts, cb) => {
          t.equal(opts.fingerprint, 'fingerprint', 'Fingerprint is passed to database as query');
          return cb(null, [{}]);
        }
      }
    }
  };
  const mockReq = {
    body: {
      fingerprint: 'fingerprint',
      otp: 'otp'
    }
  };
  const mockRes = {
    error: sinon.spy()
  };

  handler(mockCtx, mockReq, mockRes);

  t.ok(mockRes.error.calledWith(401, 'The provided Yubikey OTP is invalid.'),
    'HTTP 401 with error about Yubikey failure');

  t.end();
});

test('Valid browser fingerprint, failure on Yubikey validation', (t) => {
  const mockCtx = {
    yubikey: {
      validate: (otp, cb) => {
        t.equal(otp, 'otp', 'OTP is passed to Yubikey validator');
        return cb('error');
      }
    },
    db: {
      fingerprints: {
        find: (opts, cb) => {
          t.equal(opts.fingerprint, 'fingerprint', 'Fingerprint is passed to database as query');
          return cb(null, [{}]);
        }
      }
    }
  };
  const mockReq = {
    body: {
      fingerprint: 'fingerprint',
      otp: 'otp'
    }
  };
  const mockRes = {
    error: sinon.spy()
  };

  handler(mockCtx, mockReq, mockRes);

  t.ok(mockRes.error.calledWith(401, 'The provided Yubikey OTP is invalid.'),
    'HTTP 401 with error about Yubikey failure');

  t.end();
});

test('Valid browser fingerprint, valid Yubikey, failed user lookup', (t) => {
  const mockCtx = {
    yubikey: {
      validate: (otp, cb) => {
        t.equal(otp, 'otp', 'OTP is passed to Yubikey validator');
        return cb(null, {uid: 'uid'});
      }
    },
    db: {
      fingerprints: {
        find: (opts, cb) => {
          t.equal(opts.fingerprint, 'fingerprint', 'Fingerprint is passed to database as query');
          return cb(null, [{}]);
        }
      },
      users: {
        findOne: (opts, cb) => {
          t.equal(opts.yubikeyUID, 'uid', 'Database query properly passes decrypted UID');
          return cb('error');
        }
      }
    }
  };
  const mockReq = {
    body: {
      fingerprint: 'fingerprint',
      otp: 'otp'
    }
  };
  const mockRes = {
    error: sinon.spy()
  };

  handler(mockCtx, mockReq, mockRes);

  const expectMsg = 'The provided Yubikey OTP UID has no associated user credentials.';
  t.ok(mockRes.error.calledWith(401, expectMsg),
    'HTTP 401 with error about missing user credentials');

  t.end();
});

test('Valid browser fingerprint, valid Yubikey, valid user lookup, Apache authentication', (t) => {
  const authenticateStub = sinon.stub(authenticate, 'check', (username, password, cb) => {
    t.equal(username, 'username', 'Username is passed from DB to request');
    t.equal(password, 'password', 'Password is passed from DB to request');

    return cb(null, {
      headers: {
        'set-cookie': 'cookie'
      }
    });
  });
  const mockCtx = {
    yubikey: {
      validate: (otp, cb) => {
        t.equal(otp, 'otp', 'OTP is passed to Yubikey validator');
        return cb(null, {uid: 'uid'});
      }
    },
    db: {
      fingerprints: {
        find: (opts, cb) => {
          t.equal(opts.fingerprint, 'fingerprint', 'Fingerprint is passed to database as query');
          return cb(null, [{}]);
        }
      },
      users: {
        findOne: (opts, cb) => {
          t.equal(opts.yubikeyUID, 'uid', 'Database query properly passes decrypted UID');
          return cb(null, {username: 'username', password: 'password'});
        }
      }
    }
  };
  const mockReq = {
    body: {
      fingerprint: 'fingerprint',
      otp: 'otp'
    }
  };
  const mockRes = {
    error: sinon.spy(),
    status: sinon.spy(),
    send: sinon.spy(),
    set: sinon.spy()
  };

  handler(mockCtx, mockReq, mockRes);

  t.ok(authenticateStub.called, 'Attempt to authenticate against Apache');
  t.notOk(mockRes.error.called, 'No error is set');
  t.ok(mockRes.status.calledWith(502), 'Default status code 502 is set');
  t.ok(mockRes.send.calledWith({}), 'Empty JSON response');
  t.ok(mockRes.set.calledWith('Set-Cookie', 'cookie'), 'Cookie is proxied from Apache');

  authenticate.check.restore();
  t.end();
});
