import sinon from 'sinon';
import test from 'tape';

import handler from '../../../../../src/server/api/admin/authorize/details';

test('Missing authorization ID', (t) => {
  const mockCtx = {};
  const mockReq = {};
  const mockRes = {
    error: sinon.spy()
  };

  handler(mockCtx, mockReq, mockRes);

  t.ok(mockRes.error.calledWith(400, 'Must supply authorization ID.'),
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

test('Successful details query', (t) => {
  const mockCtx = {
    db: {
      authorizations: {
        findOne(opts, cb) {
          t.equal(opts._id, 'id', 'ID is passed from request body');

          return cb(null, {doc: true});
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
    success: sinon.spy()
  };

  handler(mockCtx, mockReq, mockRes);

  t.ok(mockRes.success.calledWith({details: {doc: true}}), 'Details are returned');

  t.end();
});
