/* global window */

import {browserHistory} from 'react-router';
import Fingerprint from 'fingerprintjs2';
import jsdom from 'jsdom';
import {mount} from 'enzyme';
import React from 'react';
import request from 'browser-request';
import sinon from 'sinon';
import test from 'tape';

import {Login} from '../../../../../../src/client/app/components/pages/login';
import browser from '../../../../../../src/client/app/util/browser';

const loading = (func) => func(() => {});

test('Login component rendering', (t) => {
  const fingerprintStub = sinon.stub(Fingerprint.prototype, 'get', (cb) => cb('fingerprint'));
  const browserStub = sinon.stub(browser, 'push');
  const requestGetStub = sinon.stub(request, 'get', (opts, cb) => {
    t.equal(opts.url, '/auth-check', 'Endpoint for initial auth check');

    return cb(null, {statusCode: 200});
  });
  const requestPostStub = sinon.stub(request, 'post', (opts, cb) => {
    t.equal(opts.url, '/api/login/is-fingerprint-valid', 'Endpoint for checking fingerprint');
    t.deepEqual(opts.json, {fingerprint: 'fingerprint'}, 'Fingerprint is passed as a parameter');

    return cb(null, {});
  });

  jsdom.changeURL(window, 'https://auth.kevinlin.info/login');
  const login = mount(
    <Login loading={loading} />
  );

  t.ok(fingerprintStub.called, 'Attempt to grab browser fingerprint on mount');
  t.ok(requestGetStub.called, 'Auth check on initial component mount');
  t.ok(requestPostStub.called, 'Fingerprint check on initial component mount');
  t.ok(browserStub.called, 'Redirect to status on successful auth check');
  t.ok(login.instance().usernameInput, 'Username text field input is present');
  t.ok(login.instance().passwordInput, 'Password text field input is present');
  t.deepEqual(login.state(), {loginStatus: {}}, 'Initial state is empty');
  t.notOk(login.find('.login-success-alert').length, 'No success alert is initially shown');
  t.notOk(login.find('.login-error-alert').length, 'No error alert is initially shown');

  request.get.restore();
  request.post.restore();
  browser.push.restore();
  Fingerprint.prototype.get.restore();
  t.end();
});

test('Redirect to redirect URL on successful auth', (t) => {
  const fingerprintStub = sinon.stub(Fingerprint.prototype, 'get', (cb) => cb('fingerprint'));
  const browserStub = sinon.stub(browser, 'go');
  const requestGetStub = sinon.stub(request, 'get', (opts, cb) => {
    t.equal(opts.url, '/auth-check', 'Endpoint for initial auth check');

    return cb(null, {statusCode: 200});
  });
  const requestPostStub = sinon.stub(request, 'post', (opts, cb) => {
    t.equal(opts.url, '/api/login/is-fingerprint-valid', 'Endpoint for checking fingerprint');
    t.deepEqual(opts.json, {fingerprint: 'fingerprint'}, 'Fingerprint is passed as a parameter');

    return cb(null, {});
  });

  jsdom.changeURL(window, 'https://auth.kevinlin.info/login?redirect=https://google.com');
  const login = mount(
    <Login loading={loading} />
  );

  t.ok(fingerprintStub.called, 'Attempt to grab browser fingerprint on mount');
  t.ok(requestGetStub.called, 'Auth check on initial component mount');
  t.ok(requestPostStub.called, 'Fingerprint check on initial component mount');
  t.ok(browserStub.calledWith('https://google.com'), 'Redirect to URL on successful auth check');
  t.ok(login.instance().usernameInput, 'Username text field input is present');
  t.ok(login.instance().passwordInput, 'Password text field input is present');
  t.deepEqual(login.state(), {loginStatus: {}}, 'Initial state is empty');
  t.notOk(login.find('.login-success-alert').length, 'No success alert is initially shown');
  t.notOk(login.find('.login-error-alert').length, 'No error alert is initially shown');

  request.get.restore();
  request.post.restore();
  browser.go.restore();
  Fingerprint.prototype.get.restore();
  t.end();
});

test('Redirect to OTP for authenticated browser', (t) => {
  const fingerprintStub = sinon.stub(Fingerprint.prototype, 'get', (cb) => cb('fingerprint'));
  const browserStub = sinon.stub(browserHistory, 'push');
  const requestGetStub = sinon.stub(request, 'get', (opts, cb) => {
    t.equal(opts.url, '/auth-check', 'Endpoint for initial auth check');

    return cb(null, {statusCode: 200});
  });
  const requestPostStub = sinon.stub(request, 'post', (opts, cb) => {
    t.equal(opts.url, '/api/login/is-fingerprint-valid', 'Endpoint for checking fingerprint');
    t.deepEqual(opts.json, {fingerprint: 'fingerprint'}, 'Fingerprint is passed as a parameter');

    return cb(null, {statusCode: 200});
  });

  jsdom.changeURL(window, 'https://auth.kevinlin.info/login?redirect=https://google.com');
  const login = mount(
    <Login loading={loading} />
  );

  t.ok(fingerprintStub.called, 'Attempt to grab browser fingerprint on mount');
  t.ok(requestGetStub.called, 'Auth check on initial component mount');
  t.ok(requestPostStub.called, 'Fingerprint check on initial component mount');
  t.ok(browserStub.calledWith({
    pathname: '/otp',
    query: {
      redirect: 'https://google.com'
    }
  }), 'Redirect to status on successful auth check');
  t.ok(login.instance().usernameInput, 'Username text field input is present');
  t.ok(login.instance().passwordInput, 'Password text field input is present');
  t.deepEqual(login.state(), {loginStatus: {}}, 'Initial state is empty');
  t.notOk(login.find('.login-success-alert').length, 'No success alert is initially shown');
  t.notOk(login.find('.login-error-alert').length, 'No error alert is initially shown');

  request.get.restore();
  request.post.restore();
  browserHistory.push.restore();
  Fingerprint.prototype.get.restore();
  t.end();
});

test('Initialization of Duo 2FA', (t) => {
  const fingerprintStub = sinon.stub(Fingerprint.prototype, 'get', (cb) => cb('fingerprint'));
  sinon.stub(request, 'get');
  const requestStub = sinon.stub(request, 'post', (opts, cb) => {
    if (opts.url === '/api/login/duo') {
      t.deepEqual(opts.json, {
        username: 'username',
        password: 'password'
      }, 'Username and password are passed to Duo authentication');

      return cb(null, null, {sigRequest: 'sig:request', duoHost: 'api.duosecurity.com'});
    }

    return null;
  });

  const login = mount(
    <Login loading={loading} />
  );

  login.instance().usernameInput.setValue('username');
  login.instance().passwordInput.setValue('password');
  login.find('.login-submit-btn').simulate('click');
  t.ok(requestStub.called, 'Request is made');
  t.ok(fingerprintStub.called, 'Fingerprint is requested');

  request.get.restore();
  request.post.restore();
  Fingerprint.prototype.get.restore();
  t.end();
});

test('Duo 2FA successful response', (t) => {
  const fingerprintStub = sinon.stub(Fingerprint.prototype, 'get', (cb) => cb('fingerprint'));
  sinon.stub(request, 'get');
  const browserStub = sinon.stub(browser, 'push');
  const requestStub = sinon.stub(request, 'post', (opts, cb) => {
    if (opts.url === '/api/login/duo') {
      t.deepEqual(opts.json, {
        username: 'username',
        password: 'password'
      }, 'Username and password are passed to Duo authentication');

      return cb(null, null, {sigRequest: 'sig:request', duoHost: 'api.duosecurity.com'});
    }

    if (opts.url === '/api/login/apache') {
      t.deepEqual(opts.json, {
        username: 'username',
        password: 'password',
        sigResponse: 'sig response'
      }, 'Credentials and sig response are passed to Apache');

      return cb(null, {statusCode: 200}, {});
    }

    return null;
  });

  jsdom.changeURL(window, 'https://auth.kevinlin.info/login');
  const login = mount(
    <Login loading={loading} />
  );

  login.instance().usernameInput.setValue('username');
  login.instance().passwordInput.setValue('password');
  login.find('.login-submit-btn').simulate('click');
  t.ok(requestStub.called, 'Request is made');
  t.ok(fingerprintStub.called, 'Fingerprint is requested');

  login.find('Duo').props().sigResponseCallback('sig response');

  t.ok(browserStub.calledWith('/status'), 'Successful redirect to status');

  request.get.restore();
  request.post.restore();
  Fingerprint.prototype.get.restore();
  browser.push.restore();
  t.end();
});

test('Duo 2FA successful response with redirect', (t) => {
  const fingerprintStub = sinon.stub(Fingerprint.prototype, 'get', (cb) => cb('fingerprint'));
  sinon.stub(request, 'get');
  const browserStub = sinon.stub(browser, 'go');
  const requestStub = sinon.stub(request, 'post', (opts, cb) => {
    if (opts.url === '/api/login/duo') {
      t.deepEqual(opts.json, {
        username: 'username',
        password: 'password'
      }, 'Username and password are passed to Duo authentication');

      return cb(null, null, {sigRequest: 'sig:request', duoHost: 'api.duosecurity.com'});
    }

    if (opts.url === '/api/login/apache') {
      t.deepEqual(opts.json, {
        username: 'username',
        password: 'password',
        sigResponse: 'sig response'
      }, 'Credentials and sig response are passed to Apache');

      return cb(null, {statusCode: 200}, {});
    }

    return null;
  });

  jsdom.changeURL(window, 'https://auth.kevinlin.info/login?redirect=https://google.com');
  const login = mount(
    <Login loading={loading} />
  );

  login.instance().usernameInput.setValue('username');
  login.instance().passwordInput.setValue('password');
  login.find('.login-submit-btn').simulate('click');
  t.ok(requestStub.called, 'Request is made');
  t.ok(fingerprintStub.called, 'Fingerprint is requested');

  login.find('Duo').props().sigResponseCallback('sig response');

  t.ok(browserStub.calledWith('https://google.com'), 'Successful redirect to status');

  request.get.restore();
  request.post.restore();
  Fingerprint.prototype.get.restore();
  browser.go.restore();
  t.end();
});
