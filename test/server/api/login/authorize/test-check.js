import sinon from 'sinon';
import test from 'tape';

import handler from '../../../../../src/server/api/login/authorize/check';

test('Missing browser fingerprint', (t) => {
  const mockCtx = {};
  const mockReq = {};
  const mockRes = {
    error: sinon.spy()
  };

  handler(mockCtx, mockReq, mockRes);

  t.ok(mockRes.error.calledWith(400, 'Browser fingerprint must be supplied.'),
    'Missing browser fingerprint error');

  t.end();
});

test('Missing authorization ID', (t) => {
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

  t.ok(mockRes.error.calledWith(400, 'Authorization ID must be supplied.'),
    'Missing authorization ID error');

  t.end();
});

test('Nonexistent authorization entry', (t) => {
  const mockCtx = {
    db: {
      authorizations: {
        findOne(opts, cb) {
          t.equal(opts._id, 'id', 'ID is passed from request');

          return cb('error');
        }
      }
    }
  };
  const mockReq = {
    body: {
      fingerprint: 'fingerprint',
      authorizationID: 'id'
    }
  };
  const mockRes = {
    error: sinon.spy()
  };

  handler(mockCtx, mockReq, mockRes);

  t.ok(mockRes.error.calledWith(404, 'No authorization exists with this ID.'),
    'Nonexistent authorization error');

  t.end();
});

test('Browser fingerprint mismatch', (t) => {
  const mockCtx = {
    db: {
      authorizations: {
        findOne(opts, cb) {
          t.equal(opts._id, 'id', 'ID is passed from request');

          return cb(null, {fingerprint: 'invalid'});
        }
      }
    }
  };
  const mockReq = {
    body: {
      fingerprint: 'fingerprint',
      authorizationID: 'id'
    }
  };
  const mockRes = {
    error: sinon.spy()
  };

  handler(mockCtx, mockReq, mockRes);

  const msg = 'Authorization ID mismatch with requesting client fingerprint.';
  t.ok(mockRes.error.calledWith(403, msg), 'Fingerprint mismatch error');

  t.end();
});

test('Unapproved request', (t) => {
  const mockCtx = {
    db: {
      authorizations: {
        findOne(opts, cb) {
          t.equal(opts._id, 'id', 'ID is passed from request');

          return cb(null, {fingerprint: 'fingerprint'});
        }
      }
    }
  };
  const mockReq = {
    body: {
      fingerprint: 'fingerprint',
      authorizationID: 'id'
    }
  };
  const mockRes = {
    error: sinon.spy()
  };

  handler(mockCtx, mockReq, mockRes);

  t.ok(mockRes.error.calledWith(403, 'Request is not approved.'), 'Unapproved request error');

  t.end();
});

test('Successful request approval', (t) => {
  const mockCtx = {
    db: {
      authorizations: {
        findOne(opts, cb) {
          t.equal(opts._id, 'id', 'ID is passed from request');

          return cb(null, {fingerprint: 'fingerprint', cookie: 'cookie'});
        },
        remove(opts, cb) {
          t.equal(opts._id, 'id', 'ID is passed from request for removal');

          return cb();
        }
      }
    }
  };
  const mockReq = {
    body: {
      fingerprint: 'fingerprint',
      authorizationID: 'id'
    }
  };
  const mockRes = {
    set: sinon.spy(),
    success: sinon.spy()
  };

  handler(mockCtx, mockReq, mockRes);

  t.ok(mockRes.set.calledWith('Set-Cookie', 'cookie'),
    'Cookie from authorization is attached to response');
  t.ok(mockRes.success.called, 'Request is successful');

  t.end();
});
