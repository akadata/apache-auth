import sinon from 'sinon';
import test from 'tape';

import handler from '../../../../../src/server/api/admin/fingerprint/list';

test('Errored fingerprint listing', (t) => {
  const mockCtx = {
    db: {
      fingerprints: {
        find: (opts, cb) => {
          t.deepEqual(opts, {}, 'All matching documents are requested');

          return cb('error');
        }
      }
    }
  };
  const mockRes = {
    error: sinon.spy(),
    success: sinon.spy()
  };

  handler(mockCtx, {}, mockRes);

  t.ok(mockRes.error.called, 'Request errors');
  t.notOk(mockRes.success.called, 'DB query is not successful');

  t.end();
});

test('Successful fingerprint listing', (t) => {
  const mockCtx = {
    db: {
      fingerprints: {
        find: (opts, cb) => {
          t.deepEqual(opts, {}, 'All matching documents are requested');

          return cb(null, []);
        }
      }
    }
  };
  const mockRes = {
    error: sinon.spy(),
    success: sinon.spy()
  };

  handler(mockCtx, {}, mockRes);

  t.notOk(mockRes.error.called, 'No error in query');
  t.ok(mockRes.success.calledWith({fingerprints: []}), 'JSON data contains queried documents');

  t.end();
});
