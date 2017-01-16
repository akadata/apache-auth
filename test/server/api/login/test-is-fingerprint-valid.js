import sinon from 'sinon';
import test from 'tape';

import handler from '../../../../src/server/api/login/is-fingerprint-valid';

test('Undefined database error on fingerprint lookup', (t) => {
  const mockCtx = {
    db: {
      fingerprints: {
        find: (opts, cb) => cb('error')
      }
    }
  };
  const mockRes = {
    error: sinon.spy(),
    success: sinon.spy()
  };

  handler(mockCtx, null, mockRes);

  t.ok(mockRes.error.called, 'Generic error response');
  t.notOk(mockRes.success.called, 'Request is not successful');

  t.end();
});

test('Untrusted browser fingerprint', (t) => {
  const mockCtx = {
    db: {
      fingerprints: {
        find: (opts, cb) => {
          t.equal(opts.fingerprint, 'fingerprint', 'Fingerprint is passed from request to query');

          return cb(null, []);
        }
      }
    }
  };
  const mockReq = {
    body: {
      fingerprint: 'fingerprint'
    }
  };
  const mockRes = {
    error: sinon.spy(),
    success: sinon.spy()
  };

  handler(mockCtx, mockReq, mockRes);

  t.ok(mockRes.error.calledWith(404, 'This browser fingerprint is not trusted.'),
    'HTTP 404 with a fingerprint that is not trusted');
  t.notOk(mockRes.success.called, 'Request is not successful');

  t.end();
});

test('Trusted browser fingerprint', (t) => {
  const mockCtx = {
    db: {
      fingerprints: {
        find: (opts, cb) => {
          t.equal(opts.fingerprint, 'fingerprint', 'Fingerprint is passed from request to query');

          return cb(null, [{}]);
        }
      }
    }
  };
  const mockReq = {
    body: {
      fingerprint: 'fingerprint'
    }
  };
  const mockRes = {
    error: sinon.spy(),
    success: sinon.spy()
  };

  handler(mockCtx, mockReq, mockRes);

  t.notOk(mockRes.error.called, 'Request is not unsuccessful');
  t.ok(mockRes.success.called, 'Request is successful');

  t.end();
});
