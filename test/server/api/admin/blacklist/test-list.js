import sinon from 'sinon';
import test from 'tape';

import config from '../../../../../config/common';
import contextFactory from '../../../../util/context-factory';
import handler from '../../../../../src/server/api/admin/blacklist/list';

test('Return value for an empty blacklist cache', (t) => {
  const mockCtx = contextFactory.create();
  const mockRes = {
    send: sinon.spy()
  };

  handler(mockCtx, null, mockRes);
  t.ok(mockRes.send.calledWith({
    success: true,
    message: null,
    entries: []
  }), 'JSON response is correct');

  t.end();
});

test('Return value for a populated blacklist cache', (t) => {
  const clock = sinon.useFakeTimers(1000);
  const mockCtx = contextFactory.create(['127.0.0.1', '192.168.1.1']);
  const mockRes = {
    send: sinon.spy()
  };

  handler(mockCtx, null, mockRes);
  t.ok(mockRes.send.calledWith({
    success: true,
    message: null,
    entries: [
      {
        ip: '192.168.1.1',
        expiry: Math.round((1000 + config.blacklist.TTL) / 1000),
        isBlacklisted: true,
        count: config.blacklist.maxFailedAttempts + 1,
        timestamp: 1000
      },
      {
        ip: '127.0.0.1',
        expiry: Math.round((1000 + config.blacklist.TTL) / 1000),
        isBlacklisted: true,
        count: config.blacklist.maxFailedAttempts + 1,
        timestamp: 1000
      }
    ]
  }), 'JSON response is correct');

  clock.restore();
  t.end();
});
