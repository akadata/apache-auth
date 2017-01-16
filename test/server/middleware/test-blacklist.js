import sinon from 'sinon';
import test from 'tape';

import blacklist from '../../../src/server/middleware/blacklist';

test('Blacklisted IP returns HTTP 403', (t) => {
  const mockCtx = {
    blacklist: {
      isBlacklisted: () => true
    }
  };
  const mockRes = {
    error: sinon.spy()
  };
  const mockNext = sinon.spy();

  blacklist(mockCtx, {}, mockRes, mockNext);

  t.ok(mockRes.error.calledWith(403, 'This IP address is blacklisted.'), 'Response is errored');
  t.notOk(mockNext.called, 'Logic is not passed to next handler');

  t.end();
});

test('Non-blacklisted IP passes logic to next handler', (t) => {
  const mockCtx = {
    blacklist: {
      isBlacklisted: () => false
    }
  };
  const mockRes = {
    error: sinon.spy()
  };
  const mockNext = sinon.spy();

  blacklist(mockCtx, {}, mockRes, mockNext);

  t.notOk(mockRes.error.called, 'Response is not errored');
  t.ok(mockNext.called, 'Logic is passed to next handler');

  t.end();
});
