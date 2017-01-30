import {mount, shallow} from 'enzyme';
import React from 'react';
import request from 'browser-request';
import sinon from 'sinon';
import test from 'tape';

import AdminU2F from '../../../../../../src/client/app/components/pages/admin/admin-u2f';

const loading = (func) => func(() => {});

test('Security keys are loaded on mount', (t) => {
  const requestStub = sinon.stub(request, 'get', (opts, cb) => {
    t.equal(opts.url, '/api/admin/u2f/list', 'Endpoint is correct');
    t.deepEqual(opts.json, {}, 'No JSON body');

    return cb(null, {statusCode: 200}, {users: ['1', '2', '3']});
  });

  const u2f = mount(
    <AdminU2F loading={loading} />
  );

  t.ok(requestStub.called, 'Attempt to fetch security keys on mount');
  t.deepEqual(u2f.state().users, ['1', '2', '3'],
    'Component state is updated with security keys');

  request.get.restore();
  t.end();
});

test('Error in registering key', (t) => {
  const requestStub = sinon.stub(request, 'post', (opts, cb) => {
    t.equal(opts.url, '/api/admin/u2f/register-challenge', 'Endpoint is correct');
    t.deepEqual(opts.json, {username: 'username'});

    return cb('error');
  });

  const u2f = shallow(
    <AdminU2F loading={loading} />
  );

  u2f.setState({username: 'username'});
  u2f.instance().handleRegisterKeyClick({preventDefault: () => {}});

  t.ok(requestStub.called, 'Registration challenge request is made');

  request.post.restore();
  t.end();
});

test('Successful registration challenge', (t) => {
  const requestStub = sinon.stub(request, 'post', (opts, cb) => {
    t.equal(opts.url, '/api/admin/u2f/register-challenge', 'Endpoint is correct');
    t.deepEqual(opts.json, {username: 'username'});

    return cb(null, {statusCode: 200});
  });

  const u2f = shallow(
    <AdminU2F loading={loading} />
  );

  u2f.setState({username: 'username'});
  u2f.instance().handleRegisterKeyClick({preventDefault: () => {}});

  t.ok(requestStub.called, 'Registration challenge request is made');

  request.post.restore();
  t.end();
});

test('Successful registration verification', (t) => {
  const requestStub = sinon.stub(request, 'post', (opts, cb) => {
    t.equal(opts.url, '/api/admin/u2f/register-verify', 'Endpoint is correct');
    t.deepEqual(opts.json, {username: 'username', registerResponse: 'register response'});

    return cb(null, {statusCode: 200});
  });

  const u2f = shallow(
    <AdminU2F loading={loading} />
  );

  u2f.setState({username: 'username'});
  // Tbh I'm very tired right now, this will do
  u2f.instance().loadSecurityKeyUsers = () => {};
  u2f.instance().onU2FRegister(() => {}, 'register response');

  t.ok(requestStub.called, 'Registration challenge request is made');

  request.post.restore();
  t.end();
});
