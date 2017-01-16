import sinon from 'sinon';
import test from 'tape';

import handler from '../../../../../src/server/api/admin/fingerprint/revoke';

test('Missing ID in fingerprint revocation', (t) => {
  const mockCtx = {
    db: {
      fingerprints: {
        remove: sinon.spy()
      }
    }
  };
  const mockRes = {
    error: sinon.spy()
  };

  handler(mockCtx, {}, mockRes);

  t.ok(mockRes.error.calledWith(400, 'You must specify the ID of the fingerprint to revoke.'),
    'Error about missing document ID');
  t.notOk(mockCtx.db.fingerprints.remove.called, 'No attempt to remove any documents');

  t.end();
});

test('Successful fingerprint revocation', (t) => {
  const mockCtx = {
    db: {
      fingerprints: {
        remove: (opts, cb) => {
          t.equal(opts._id, 'id', 'ID is passed to DB query');

          return cb();
        }
      }
    }
  };
  const mockReq = {
    body: {
      id: 'id'
    }
  };
  const mockRes = {
    success: sinon.spy()
  };

  handler(mockCtx, mockReq, mockRes);

  t.ok(mockRes.success.called, 'Request is successful');

  t.end();
});
