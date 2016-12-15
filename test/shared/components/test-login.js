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
