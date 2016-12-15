/* global global,setTimeout */

import {browserHistory} from 'react-router';
import {mount, shallow} from 'enzyme';
import jsdom from 'jsdom';
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
  setLoginCredentials(login, 'username', 'password', t);
  login.find('.login-btn').simulate('click');

  // Request in-flight
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

test('Incorrect username/password pair', (t) => {
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

    setTimeout(() => cb(null, {
      statusCode: 401
    }), 400);
  });

  const login = mount(
    <Login />
  );

  clock.tick(205);
  t.notOk(login.state().isLoading, 'isLoading state is false');
  t.notOk(login.state().isLoginComplete, 'isLoginComplete state is false');
  t.notOk(requestStub.called, 'No authentication request is made yet');

  // Enter in username/password credentials and submit
  setLoginCredentials(login, 'username', 'password', t);
  login.find('.login-btn').simulate('click');

  // Request in-flight
  t.ok(requestStub.called, 'Request is made after click');
  t.ok(login.state().isLoading, 'isLoading state is true after click');
  t.notOk(login.state().isLoginComplete, 'isLoginComplete state is false');

  // Request completed
  clock.tick(1005);
  t.ok(login.state().isLoginComplete, 'isLoginComplete state is true after request completed');
  t.notOk(login.state().isLoading, 'isLoading is falsified');
  t.equal(login.state().errorMessage, 'The username/password combination is incorrect. Please try again.',
    'Error message is set appropriately');
  t.equal(login.find('.login-success-alert').length, 0, 'No success alert is displayed');
  t.equal(login.find('.login-error-alert').length, 1, 'Error alert is displayed');

  request.get.restore();
  request.post.restore();
  clock.restore();
  t.end();
});

test('Blacklisted IP on Duo 2FA initialization', (t) => {
  const clock = sinon.useFakeTimers();
  sinon.stub(request, 'get', (opts, cb) => {
    t.equal(opts.url, '/auth-check', 'Authentication check endpoint is correct');

    setTimeout(() => cb(null, {
      statusCode: 403
    }), 200);
  });
  const historyStub = sinon.stub(browserHistory, 'push');
  const requestStub = sinon.stub(request, 'post', (opts, cb) => {
    t.equal(opts.url, '/api/login-duo', 'Duo 2FA initialization endpoint is correct');
    t.deepEqual(opts.json, {
      username: 'username',
      password: 'password'
    }, 'JSON body contains credentials');

    setTimeout(() => cb(null, {
      statusCode: 403
    }), 400);
  });

  const login = mount(
    <Login />
  );

  clock.tick(205);
  t.notOk(login.state().isLoading, 'isLoading state is false');
  t.notOk(login.state().isLoginComplete, 'isLoginComplete state is false');
  t.notOk(requestStub.called, 'No authentication request is made yet');

  // Enter in username/password credentials and submit
  setLoginCredentials(login, 'username', 'password', t);
  login.find('.login-btn').simulate('click');

  // Request in-flight
  t.ok(requestStub.called, 'Request is made after click');
  t.ok(login.state().isLoading, 'isLoading state is true after click');
  t.notOk(login.state().isLoginComplete, 'isLoginComplete state is false');

  // Request completed
  clock.tick(1005);
  t.ok(historyStub.calledWith('/blacklist'), 'Immediate redirect to blacklist');

  browserHistory.push.restore();
  request.get.restore();
  request.post.restore();
  clock.restore();
  t.end();
});

test('Successful Duo 2FA initialization', (t) => {
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

    setTimeout(() => cb(null, {
      statusCode: 200
    }, {
      sigRequest: 'sigRequest',
      duoHost: 'duoHost'
    }), 400);
  });

  const login = mount(
    <Login />
  );

  clock.tick(205);
  t.notOk(login.state().isLoading, 'isLoading state is false');
  t.notOk(login.state().isLoginComplete, 'isLoginComplete state is false');
  t.notOk(requestStub.called, 'No authentication request is made yet');

  // Enter in username/password credentials and submit
  setLoginCredentials(login, 'username', 'password', t);
  login.find('.login-btn').simulate('click');

  // Request in-flight
  t.ok(requestStub.called, 'Request is made after click');
  t.ok(login.state().isLoading, 'isLoading state is true after click');
  t.notOk(login.state().isLoginComplete, 'isLoginComplete state is false');

  // Request completed
  clock.tick(1005);
  t.notOk(login.state().isLoginComplete, 'isLoginComplete state is still false after Duo init');
  t.notOk(login.state().isLoading, 'isLoading is falsified');
  t.notOk(login.state().errorMessage, 'No error message state is set');
  t.equal(login.state().sigRequest, 'sigRequest', 'sigRequest state is saved');
  t.equal(login.state().duoHost, 'duoHost', 'duoHost state is saved');
  t.equal(login.find('.login-success-alert').length, 0, 'No success alert is displayed');
  t.equal(login.find('.login-error-alert').length, 0, 'No error alert is displayed');

  request.get.restore();
  request.post.restore();
  clock.restore();
  t.end();
});

test('Duo response after 2FA with redirect', (t) => {
  const clock = sinon.useFakeTimers();
  const historyStub = sinon.stub(browserHistory, 'push');
  const requestStub = sinon.stub(request, 'post', (opts, cb) => {
    t.equal(opts.url, '/api/login-apache', 'Apache login endpoint is correct');
    t.deepEqual(opts.json, {
      username: 'username',
      password: 'password',
      sigResponse: 'sigresponse'
    }, 'JSON data passed to login endpoint is correct');

    // Simulate a 1000 ms network delay
    setTimeout(() => cb(null, {
      statusCode: 200
    }), 1000);
  });

  // Set a redirect URL before rendering the component
  jsdom.changeURL(global.window, 'http://localhost:18800/login?redirect=https://google.com');
  const login = shallow(
    <Login />
  );
  setLoginCredentials(login, 'username', 'password', t);

  // Trigger a Duo callback
  login.instance().onDuoResp({
    firstChild: {
      value: 'sigresponse'
    }
  });

  // Request in-flight
  t.notOk(login.state().sigRequest, 'State for sigRequest is cleared');
  t.ok(login.state().isLoading, 'isLoading is set');
  t.ok(requestStub.called, 'Request is made to Apache login endpoint');

  // Request completed
  clock.tick(1005);
  t.notOk(login.state().isLoading, 'isLoading is falsified');
  t.ok(login.state().isLoginComplete, 'isLoginComplete is true');
  t.ok(login.state().isLoginSuccess, 'isLoginSuccess is true');
  t.notOk(login.state().errorMessage, 'No error message');

  // Redirect after success
  clock.tick(105);
  t.equal(login.find('.login-success-alert').length, 1, 'Login success alert is displayed');
  t.notOk(historyStub.called, 'No modifications to browser history');

  browserHistory.push.restore();
  request.post.restore();
  clock.restore();
  t.end();
});

test('Duo response after 2FA without redirect', (t) => {
  const clock = sinon.useFakeTimers();
  const historyStub = sinon.stub(browserHistory, 'push');
  sinon.stub(request, 'post', (opts, cb) => cb(null, {statusCode: 200}));

  // Set a redirect URL before rendering the component
  jsdom.changeURL(global.window, 'http://localhost:18800');
  const login = shallow(
    <Login />
  );
  setLoginCredentials(login, 'username', 'password', t);

  // Trigger a Duo callback
  login.instance().onDuoResp({
    firstChild: {
      value: 'sigresponse'
    }
  });

  // Redirect after success
  clock.tick(105);
  t.ok(historyStub.calledWith('/status'), 'Redirect to status page');

  browserHistory.push.restore();
  request.post.restore();
  clock.restore();
  t.end();
});

test('Parse redirect URL from window href', (t) => {
  const login = shallow(
    <Login />
  );

  const url = 'http://localhost:18800/login?redirect=https://google.com';
  t.equal(login.instance().parseRedirectURL(url), 'https://google.com', 'Redirect URL is parsed correctly');

  t.end();
});

function setLoginCredentials(component, username, password, t) {
  component.find('.username-field').simulate('change', {
    target: {
      value: username
    }
  });
  component.find('.password-field').simulate('change', {
    target: {
      value: password
    }
  });
  t.equal(component.state().username, username, 'Username state is set properly');
  t.equal(component.state().password, password, 'Password state is set properly');
}
