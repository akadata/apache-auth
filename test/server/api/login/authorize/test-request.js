import sinon from 'sinon';
import test from 'tape';

import handler from '../../../../../src/server/api/login/authorize/request';

test('Missing browser fingerprint', (t) => {
  const mockCtx = {};
  const mockReq = {};
  const mockRes = {
    error: sinon.spy()
  };

  handler(mockCtx, mockReq, mockRes);

  t.ok(mockRes.error.calledWith(400, 'Browser fingerprint must be supplied.'),
    'Missing browser fingerprint error');

  t.end();
});

test('Missing authorization scope', (t) => {
  const mockCtx = {};
  const mockReq = {
    body: {
      fingerprint: 'fingerprint'
    }
  };
  const mockRes = {
    error: sinon.spy()
  };

  handler(mockCtx, mockReq, mockRes);

  t.ok(mockRes.error.calledWith(400, 'Valid domain scope must be supplied.'),
    'Missing domain scope error');

  t.end();
});

test('Authorization entry insertion error', (t) => {
  const clock = sinon.useFakeTimers(1000);
  const mockCtx = {
    db: {
      authorizations: {
        insert(doc, cb) {
          t.equal(doc.timestamp, 1000, 'Timestamp is correct');
          t.equal(doc.expiry, 1000 + 5 * 60 * 1000, 'Expiry is correct');
          t.equal(doc.fingerprint, 'fingerprint', 'Fingerprint is correct');
          t.equal(doc.userAgent, 'user-agent', 'User agent is correct');
          t.equal(doc.scope, 'example.com', 'Domain scope is correct');

          return cb('error');
        }
      }
    }
  };
  const mockReq = {
    body: {
      fingerprint: 'fingerprint',
      scope: 'example.com'
    },
    header(name) {
      t.equal(name, 'user-agent', 'User agent header is requested');

      return 'user-agent';
    },
    remoteIP: '127.0.0.1'
  };
  const mockRes = {
    error: sinon.spy()
  };

  handler(mockCtx, mockReq, mockRes);

  t.ok(mockRes.error.calledWith(500, 'Server-side database error; please try again.'),
    'Generic database insertion error');

  clock.restore();
  t.end();
});

test('Successful authorization request with Allu alert and automatic expiry', (t) => {
  const clock = sinon.useFakeTimers(1000);
  const mockCtx = {
    db: {
      authorizations: {
        insert(doc, cb) {
          t.equal(doc.timestamp, 1000, 'Timestamp is correct');
          t.equal(doc.expiry, 1000 + 5 * 60 * 1000, 'Expiry is correct');
          t.equal(doc.fingerprint, 'fingerprint', 'Fingerprint is correct');
          t.equal(doc.userAgent, 'user-agent', 'User agent is correct');
          t.equal(doc.scope, 'example.com', 'Domain scope is correct');

          return cb(null, {_id: 'id', ...doc});
        },
        remove: sinon.spy()
      }
    },
    allu: {
      template(tag, text, buttons, cb) {
        const expectButtons = [
          {
            title: 'View details',
            url: 'https://auth.kevinlin.info/admin/authorize/id'
          }
        ];

        const [notice, newline, ip, userAgent, scope, expires] = text.split('\n');

        t.equal(tag, 'Auth', 'Tag is correct');
        t.equal(notice, 'New temporary authorization request.', 'Notice text is correct');
        t.equal(newline, '', 'Newline is inserted in text before metadata');
        t.equal(ip, 'IP: 127.0.0.1', 'IP text is correct');
        t.equal(userAgent, 'User agent: user-agent', 'User agent text is correct');
        t.equal(scope, 'Scope: example.com', 'Scope text is correct');
        t.ok(/\d+:05:01 (A|P)M/.test(expires), 'Expires text is correct');
        t.deepEqual(buttons, expectButtons, 'Buttons are correct');

        return cb();
      }
    }
  };
  const mockReq = {
    body: {
      fingerprint: 'fingerprint',
      scope: 'example.com'
    },
    header(name) {
      t.equal(name, 'user-agent', 'User agent header is requested');

      return 'user-agent';
    },
    remoteIP: '127.0.0.1'
  };
  const mockRes = {
    success: sinon.spy()
  };

  handler(mockCtx, mockReq, mockRes);

  t.ok(mockRes.success.calledWith({authorizationID: 'id'}),
    'Successful authorization request and Allu dispatch');

  t.notOk(mockCtx.db.authorizations.remove.called, 'Authorization request is still alive');
  clock.tick(5 * 60 * 1000);
  t.ok(mockCtx.db.authorizations.remove.called, 'Authorization request is automatically removed');

  clock.restore();
  t.end();
});
