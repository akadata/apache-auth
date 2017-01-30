import sinon from 'sinon';
import test from 'tape';

import handler from '../../../../../src/server/api/admin/u2f/list';

test('Errored U2F security keys listing', (t) => {
  const mockCtx = {
    db: {
      users: {
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

test('Successful security keys listing', (t) => {
  const mockCtx = {
    db: {
      users: {
        find: (opts, cb) => {
          t.deepEqual(opts, {}, 'All matching documents are requested');

          return cb(null, [
            {username: '1'},
            {username: '2', keyHandle: 'non-null'},
            {username: '3', keyHandle: 'non-null'}
          ]);
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
  t.ok(mockRes.success.calledWith({users: ['2', '3']}),
    'JSON data contains usernames with registered security keys');

  t.end();
});
