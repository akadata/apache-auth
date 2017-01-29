import sinon from 'sinon';
import test from 'tape';

import handler from '../../../../../src/server/api/login/u2f/challenge';

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

test('Unknown fingerprint', (t) => {
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
      fingerprint: 'fingerprint'
    }
  };
  const mockRes = {
    error: sinon.spy()
  };

  handler(mockCtx, mockReq, mockRes);

  t.ok(mockRes.error.calledWith(404, 'The requested fingerprint has no associated username.'),
    'HTTP 404 on fingerprint with no user association');

  t.end();
});

test('Known fingerprint, but no corresponding user', (t) => {
  const mockCtx = {
    db: {
      fingerprints: {
        findOne: (opts, cb) => {
          t.equal(opts.fingerprint, 'fingerprint', 'Fingerprint is passed to DB query');

          return cb(null, {});
        }
      },
      users: {
        findOne: (opts, cb) => cb('error')
      }
    }
  };
  const mockReq = {
    body: {
      fingerprint: 'fingerprint'
    }
  };
  const mockRes = {
    error: sinon.spy()
  };

  handler(mockCtx, mockReq, mockRes);

  t.ok(mockRes.error.calledWith(404, 'The fingerprint\'s associated username does not exist.'),
    'HTTP 404 on valid fingerprint but no corresponding user');

  t.end();
});

test('Known fingerprint with no security key registered', (t) => {
  const mockCtx = {
    db: {
      fingerprints: {
        findOne: (opts, cb) => {
          t.equal(opts.fingerprint, 'fingerprint', 'Fingerprint is passed to DB query');

          return cb(null, {});
        }
      },
      users: {
        findOne: (opts, cb) => cb(null, {})
      }
    }
  };
  const mockReq = {
    body: {
      fingerprint: 'fingerprint'
    }
  };
  const mockRes = {
    error: sinon.spy()
  };

  handler(mockCtx, mockReq, mockRes);

  t.ok(mockRes.error.calledWith(404, 'The associated user has no security key registered.'),
    'HTTP 404 on valid fingerprint but no security key');

  t.end();
});

test('Successful authentication challenge', (t) => {
  const mockCtx = {
    db: {
      fingerprints: {
        findOne: (opts, cb) => {
          t.equal(opts.fingerprint, 'fingerprint', 'Fingerprint is passed to DB query');

          return cb(null, {username: 'username'});
        },
        update: (target, update, cb) => {
          t.equal(target.fingerprint, 'fingerprint',
            'Fingerprint document is updated with auth challenge');
          t.ok(update.$set.authRequest, 'Auth request is added to fingerprint document');

          return cb();
        }
      },
      users: {
        findOne: (opts, cb) => {
          t.equal(opts.username, 'username', 'Username is passed from fingerprint DB query');

          return cb(null, {keyHandle: 'key handle'});
        }
      }
    }
  };
  const mockReq = {
    body: {
      fingerprint: 'fingerprint'
    }
  };
  const mockRes = {
    success: sinon.spy()
  };

  handler(mockCtx, mockReq, mockRes);

  t.ok(mockRes.success.called, 'Auth challenge is successful');

  t.end();
});
