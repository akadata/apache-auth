import sinon from 'sinon';
import test from 'tape';

import remoteIP from '../../../src/server/middleware/remote-ip';

test('IP address in proxy X-Forwarded-For header', (t) => {
  const mockReq = {
    headers: {
      'x-forwarded-for': '127.0.0.1'
    }
  };
  const mockNext = sinon.spy();

  remoteIP(null, mockReq, null, mockNext);

  t.equal(mockReq.remoteIP, '127.0.0.1', 'Remote IP is added to request');
  t.ok(mockNext.called, 'Next handler is always invoked');

  t.end();
});

test('IP address in connection metadata', (t) => {
  const mockReq = {
    connection: {
      remoteAddress: '127.0.0.1'
    }
  };
  const mockNext = sinon.spy();

  remoteIP(null, mockReq, null, mockNext);

  t.equal(mockReq.remoteIP, '127.0.0.1', 'Remote IP is added to request');
  t.ok(mockNext.called, 'Next handler is always invoked');

  t.end();
});

test('Unknown remote IP', (t) => {
  const mockReq = {};
  const mockNext = sinon.spy();

  remoteIP(null, mockReq, null, mockNext);

  t.equal(mockReq.remoteIP, null, 'Remote IP is null');
  t.ok(mockNext.called, 'Next handler is always invoked');

  t.end();
});