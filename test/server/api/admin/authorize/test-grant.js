import sinon from 'sinon';
import test from 'tape';

import authenticate from '../../../../../src/server/util/authenticate';
import handler from '../../../../../src/server/api/admin/authorize/grant';

test('Missing remote authentication username', (t) => {
  const mockCtx = {};
  const mockReq = {};
  const mockRes = {
    error: sinon.spy()
  };

  handler(mockCtx, mockReq, mockRes);

  t.ok(mockRes.error.calledWith(400, 'Authorization username must be supplied.'),
    'Missing authorization username error');

  t.end();
});

test('Missing authorization ID', (t) => {
  const mockCtx = {};
  const mockReq = {
    body: {
      username: 'username'
    }
  };
  const mockRes = {
    error: sinon.spy()
  };

  handler(mockCtx, mockReq, mockRes);

  t.ok(mockRes.error.calledWith(400, 'Authorization ID must be supplied.'),
    'Missing authorization ID error');

  t.end();
});

test('Nonexistent authorization username', (t) => {
  const mockCtx = {
    db: {
      users: {
        findOne(opts, cb) {
          t.equal(opts.username, 'username', 'Username is passed from request body');

          return cb('error');
        }
      }
    }
  };
  const mockReq = {
    body: {
      username: 'username',
      authorizationID: 'id'
    }
  };
  const mockRes = {
    error: sinon.spy()
  };

  handler(mockCtx, mockReq, mockRes);

  t.ok(mockRes.error.calledWith(404, 'No user exists with this username.'),
    'Nonexistent authorization username error');

  t.end();
});

test('Nonexistent authorization request', (t) => {
  const mockCtx = {
    db: {
      users: {
        findOne(opts, cb) {
          t.equal(opts.username, 'username', 'Username is passed from request body');

          return cb(null, {username: 'username', password: 'password'});
        }
      },
      authorizations: {
        findOne(opts, cb) {
          t.equal(opts._id, 'id', 'ID is passed from request body');

          return cb('error');
        }
      }
    }
  };
  const mockReq = {
    body: {
      username: 'username',
      authorizationID: 'id'
    }
  };
  const mockRes = {
    error: sinon.spy()
  };

  handler(mockCtx, mockReq, mockRes);

  t.ok(mockRes.error.calledWith(404, 'No such authorization request exists.'),
    'Nonexistent authorization request entry error');

  t.end();
});

test('Expired authorization request', (t) => {
  const mockCtx = {
    db: {
      users: {
        findOne(opts, cb) {
          t.equal(opts.username, 'username', 'Username is passed from request body');

          return cb(null, {username: 'username', password: 'password'});
        }
      },
      authorizations: {
        findOne(opts, cb) {
          t.equal(opts._id, 'id', 'ID is passed from request body');

          return cb(null, {expiry: 0});
        }
      }
    }
  };
  const mockReq = {
    body: {
      username: 'username',
      authorizationID: 'id'
    }
  };
  const mockRes = {
    error: sinon.spy()
  };

  handler(mockCtx, mockReq, mockRes);

  t.ok(mockRes.error.calledWith(400, 'This request is past expiry, and cannot be approved.'),
    'Expired authorization request entry error');

  t.end();
});

test('Upstream authentication validation error', (t) => {
  const checkStub = sinon.stub(authenticate, 'check', (username, password, cb) => {
    t.equal(username, 'username', 'Username is fetched from database');
    t.equal(password, 'password', 'password is fetched from database');

    return cb('error');
  });
  const mockCtx = {
    db: {
      users: {
        findOne(opts, cb) {
          t.equal(opts.username, 'username', 'Username is passed from request body');

          return cb(null, {username: 'username', password: 'password'});
        }
      },
      authorizations: {
        findOne(opts, cb) {
          t.equal(opts._id, 'id', 'ID is passed from request body');

          return cb(null, {expiry: Date.now() + 1000});
        }
      }
    }
  };
  const mockReq = {
    body: {
      username: 'username',
      authorizationID: 'id'
    }
  };
  const mockRes = {
    error: sinon.spy()
  };

  handler(mockCtx, mockReq, mockRes);

  t.ok(checkStub.called, 'Upstream authentication attempt with database credentials');
  t.ok(mockRes.error.calledWith(500, 'There was an upstream error from the authentication server.'),
    'Upstream authentication validation error');

  authenticate.check.restore();
  t.end();
});

test('Successful authentication with upstream server and cookie modification', (t) => {
  const clock = sinon.useFakeTimers(1488124270946);
  const checkStub = sinon.stub(authenticate, 'check', (username, password, cb) => {
    t.equal(username, 'username', 'Username is fetched from database');
    t.equal(password, 'password', 'password is fetched from database');

    const resp = {
      statusCode: 200,
      headers: {
        'set-cookie': ['kiwi-session=cookie']
      }
    };
    return cb(null, resp);
  });
  const mockCtx = {
    db: {
      users: {
        findOne(opts, cb) {
          t.equal(opts.username, 'username', 'Username is passed from request body');

          return cb(null, {username: 'username', password: 'password'});
        }
      },
      authorizations: {
        findOne(opts, cb) {
          t.equal(opts._id, 'id', 'ID is passed from request body');

          const doc = {
            domain: 'example.com',
            expiry: Date.now() + 1000
          };
          return cb(null, doc);
        },

        update(opts, modification, cb) {
          const expectCookie = [
            'kiwi-session=cookie',
            'Path=/',
            'Expires=Sun, 26 Feb 2017 16:21:10 GMT',
            'HttpOnly',
            'Secure'
          ].join('; ');

          t.equal(opts._id, 'id', 'ID is passed from request');
          t.deepEqual(modification, {$set: {cookie: expectCookie}});

          return cb();
        }
      }
    }
  };
  const mockReq = {
    body: {
      username: 'username',
      authorizationID: 'id'
    }
  };
  const mockRes = {
    success: sinon.spy()
  };

  handler(mockCtx, mockReq, mockRes);

  t.ok(checkStub.called, 'Upstream authentication attempt with database credentials');
  t.ok(mockRes.success.called, 'Request is successful');

  authenticate.check.restore();
  clock.restore();
  t.end();
});
