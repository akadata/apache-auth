import sinon from 'sinon';
import test from 'tape';
import u2f from 'u2f';

import handler from '../../../../../src/server/api/admin/u2f/register-challenge';

test('Missing username in registration challenge', (t) => {
  const mockCtx = {};
  const mockReq = {};
  const mockRes = {
    error: sinon.spy(),
    success: sinon.spy()
  };

  handler(mockCtx, mockReq, mockRes);

  t.ok(mockRes.error.calledWith(400, 'A username must be associated with this U2F registration ' +
    'request.'), 'HTTP 400 with error about missing username');

  t.end();
});

test('No such username in database during registration challenge', (t) => {
  const mockCtx = {
    db: {
      users: {
        findOne: (opts, cb) => {
          t.equal(opts.username, 'username', 'Username is passed from input');

          return cb('error');
        }
      }
    }
  };
  const mockReq = {
    body: {
      username: 'username'
    }
  };
  const mockRes = {
    error: sinon.spy(),
    success: sinon.spy()
  };

  handler(mockCtx, mockReq, mockRes);

  t.ok(mockRes.error.calledWith(404, 'Specified username does not exist in the users database.'),
    'HTTP 400 on nonexistent username');

  t.end();
});

test('Successful registration challenge', (t) => {
  const registerStub = sinon.stub(u2f, 'request').returns('register request');
  const mockCtx = {
    db: {
      users: {
        findOne: (opts, cb) => {
          t.equal(opts.username, 'username', 'Username is passed from input');

          return cb(null, {});
        },
        update: (query, update, cb) => {
          t.equal(query.username, 'username', 'Username is passed from input for update');
          t.deepEqual(update, {registerRequest: 'register request'},
            'User record is updated with the registration request');

          return cb();
        }
      }
    }
  };
  const mockReq = {
    body: {
      username: 'username'
    }
  };
  const mockRes = {
    error: sinon.spy(),
    success: sinon.spy()
  };

  handler(mockCtx, mockReq, mockRes);

  t.ok(mockRes.success.calledWith('register request'), 'Successful registration challenge');
  t.ok(registerStub.called, 'Attempt to generate registration challenge');

  u2f.request.restore();
  t.end();
});
