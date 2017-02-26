import sinon from 'sinon';
import test from 'tape';

import handler from '../../../../../src/server/api/admin/authorize/reject';

test('Missing authorization ID', (t) => {
  const mockCtx = {};
  const mockReq = {};
  const mockRes = {
    error: sinon.spy()
  };

  handler(mockCtx, mockReq, mockRes);

  t.ok(mockRes.error.calledWith(400, 'Authorization ID must be supplied.'),
    'Missing authorization ID error');

  t.end();
});

test('Nonexistent authorization request', (t) => {
  const mockCtx = {
    db: {
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

test('Successful authorization request rejection and blacklist', (t) => {
  const mockCtx = {
    db: {
      authorizations: {
        findOne(opts, cb) {
          t.equal(opts._id, 'id', 'ID is passed from request body');

          return cb(null, {ip: '127.0.0.1'});
        }
      }
    },
    blacklist: {
      add(ip) {
        t.equal(ip, '127.0.0.1', 'IP is passed from request metadata');
      }
    }
  };
  const mockReq = {
    body: {
      authorizationID: 'id'
    }
  };
  const mockRes = {
    success: sinon.spy()
  };

  handler(mockCtx, mockReq, mockRes);

  t.ok(mockRes.success.called, 'IP is blacklisted');

  t.end();
});
