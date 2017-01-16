import sinon from 'sinon';
import test from 'tape';

import contextFactory from '../../../../util/context-factory';
import handler from '../../../../../src/server/api/admin/fingerprint/add';

test('Missing name or fingerprint on fingerprint add', (t) => {
  const mockCtx = contextFactory.create();
  const mockReq = {
    body: {}
  };
  const mockRes = {
    error: sinon.spy()
  };

  handler(mockCtx, mockReq, mockRes);

  t.ok(mockRes.error.calledWith(400, 'You must specify both the name and fingerprint.'),
    'Error message about missing name or fingerprint');

  t.end();
});

test('Successful addition of fingerprint', (t) => {
  const mockCtx = {
    db: {
      fingerprints: {
        insert: (data, cb) => {
          t.deepEqual(data, {
            name: 'name',
            fingerprint: 'fingerprint'
          }, 'Document inserted into DB is correct');

          return cb();
        }
      }
    }
  };
  const mockReq = {
    body: {
      name: 'name',
      fingerprint: 'fingerprint'
    }
  };
  const mockRes = {
    error: sinon.spy(),
    success: sinon.spy()
  };

  handler(mockCtx, mockReq, mockRes);

  t.notOk(mockRes.error.called, 'No error occurs');
  t.ok(mockRes.success.called, 'DB is updated successfully');

  t.end();
});
