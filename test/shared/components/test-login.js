/* global setTimeout */

import {browserHistory} from 'react-router';
import {mount} from 'enzyme';
import React from 'react';
import request from 'browser-request';
import sinon from 'sinon';
import test from 'tape';

import Login from '../../../src/shared/components/login';

test('Successful authentication check on initial mount', (t) => {
  const clock = sinon.useFakeTimers();
  const historyStub = sinon.stub(browserHistory, 'push');
  const requestStub = sinon.stub(request, 'get', (opts, cb) => {
    t.equal(opts.url, '/auth-check', 'Authentication check endpoint is correct');

    // Simulate a 1000 ms network delay
    setTimeout(() => cb(null, {
      statusCode: 200
    }), 1000);
  });

  const login = mount(
    <Login />
  );

  t.ok(login, 'Login page is rendered');

  // Request in-flight
  t.ok(login.state().isLoading, 'Component is loading');
  t.ok(requestStub.called, 'Request is made');
  t.notOk(historyStub.called, 'No redirect has occurred');

  // Request completed
  clock.tick(1005);
  t.notOk(login.state().isLoading, 'Component is no longer loading');
  t.ok(historyStub.calledWith('/status'), 'Redirect to status page on successful auth check');

  browserHistory.push.restore();
  request.get.restore();
  clock.restore();
  t.end();
});

test('Unsuccessful authentication check on initial mount', (t) => {
  const clock = sinon.useFakeTimers();
  const historyStub = sinon.stub(browserHistory, 'push');
  const requestStub = sinon.stub(request, 'get', (opts, cb) => {
    t.equal(opts.url, '/auth-check', 'Authentication check endpoint is correct');

    // Simulate a 1000 ms network delay
    setTimeout(() => cb(null, {
      statusCode: 403
    }), 1000);
  });

  const login = mount(
    <Login />
  );

  t.ok(login, 'Login page is rendered');

  // Request in-flight
  t.ok(login.state().isLoading, 'Component is loading');
  t.ok(requestStub.called, 'Request is made');
  t.notOk(historyStub.called, 'No redirect has occurred');

  // Request completed
  clock.tick(1005);
  t.notOk(login.state().isLoading, 'Component is no longer loading');
  t.notOk(historyStub.called, 'No redirect to status page');

  browserHistory.push.restore();
  request.get.restore();
  clock.restore();
  t.end();
});

test('Typing in text fields updates component state', (t) => {
  sinon.stub(request, 'get');
  const login = mount(
    <Login />
  );

  t.equal(login.find('.username-field').length, 1, 'Username field is present');
  t.equal(login.find('.password-field').length, 1, 'Password field is present');
  t.notOk(login.state().username, 'No username in state yet');
  t.notOk(login.state().password, 'No password in state yet');

  login.find('.username-field').simulate('change', {
    target: {
      value: 'username'
    }
  });
  login.find('.password-field').simulate('change', {
    target: {
      value: 'password'
    }
  });

  t.equal(login.state().username, 'username', 'Username state is set properly');
  t.equal(login.state().password, 'password', 'Password state is set properly');

  request.get.restore();
  t.end();
});

test('Failure to initialize Duo 2FA', (t) => {
  const clock = sinon.useFakeTimers();
  sinon.stub(request, 'get', (opts, cb) => {
    t.equal(opts.url, '/auth-check', 'Authentication check endpoint is correct');

    setTimeout(() => cb(null, {
      statusCode: 403
    }), 200);
  });
  const requestStub = sinon.stub(request, 'post', (opts, cb) => {
    t.equal(opts.url, '/api/login-duo', 'Duo 2FA initialization endpoint is correct');
    t.deepEqual(opts.json, {
      username: 'username',
      password: 'password'
    }, 'JSON body contains credentials');

    setTimeout(() => cb({}), 400);
  });

  const login = mount(
    <Login />
  );

  clock.tick(205);
  t.notOk(login.state().isLoading, 'isLoading state is false');
  t.notOk(login.state().isLoginComplete, 'isLoginComplete state is false');
  t.notOk(requestStub.called, 'No authentication request is made yet');

  // Enter in username/password credentials and submit
  login.find('.username-field').simulate('change', {
    target: {
      value: 'username'
    }
  });
  login.find('.password-field').simulate('change', {
    target: {
      value: 'password'
    }
  });
  t.equal(login.state().username, 'username', 'Username state is set properly');
  t.equal(login.state().password, 'password', 'Password state is set properly');

  // Request in-flight
  login.find('.login-btn').simulate('click');
  t.ok(requestStub.called, 'Request is made after click');
  t.ok(login.state().isLoading, 'isLoading state is true after click');
  t.notOk(login.state().isLoginComplete, 'isLoginComplete state is false');

  // Request completed
  clock.tick(1005);
  t.ok(login.state().isLoginComplete, 'isLoginComplete state is true after request completed');
  t.notOk(login.state().isLoading, 'isLoading is falsified');
  t.equal(login.state().errorMessage, 'Failed to initialize two-factor authentication. Please try again.',
    'Error message is set appropriately');
  t.equal(login.find('.login-success-alert').length, 0, 'No success alert is displayed');
  t.equal(login.find('.login-error-alert').length, 1, 'Error alert is displayed');

  request.get.restore();
  request.post.restore();
  clock.restore();
  t.end();
});
