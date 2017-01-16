/* global window */

import Fingerprint from 'fingerprintjs2';
import jsdom from 'jsdom';
import {mount} from 'enzyme';
import React from 'react';
import request from 'browser-request';
import sinon from 'sinon';
import test from 'tape';

import browser from '../../../../../../src/client/app/util/browser';
import {OTP} from '../../../../../../src/client/app/components/pages/otp';

const loading = (func) => func(() => {});

test('OTP component rendering', (t) => {
  const browserStub = sinon.stub(browser, 'push');
  const requestStub = sinon.stub(request, 'get', (opts, cb) => {
    t.equal(opts.url, '/auth-check', 'Endpoint for initial auth check');

    return cb(null, {statusCode: 200});
  });

  jsdom.changeURL(window, 'https://auth.kevinlin.info/otp');
  const otp = mount(
    <OTP loading={loading} />
  );

  t.ok(requestStub.called, 'Auth check on initial component mount');
  t.ok(browserStub.called, 'Redirect to status on successful auth check');
  t.ok(otp.instance().otpInput, 'OTP text field input is present');
  t.deepEqual(otp.state(), {loginStatus: {}}, 'Initial state is empty');
  t.notOk(otp.find('.login-success-alert').length, 'No success alert is initially shown');
  t.notOk(otp.find('.login-error-alert').length, 'No error alert is initially shown');

  request.get.restore();
  browser.push.restore();
  t.end();
});

test('OTP redirects to redirect URL on successful auth check', (t) => {
  const browserStub = sinon.stub(browser, 'go');
  const requestStub = sinon.stub(request, 'get', (opts, cb) => {
    t.equal(opts.url, '/auth-check', 'Endpoint for initial auth check');

    return cb(null, {statusCode: 200});
  });

  jsdom.changeURL(window, 'https://auth.kevinlin.info/otp?redirect=https://google.com');
  mount(
    <OTP loading={loading} />
  );

  t.ok(requestStub.called, 'Auth check on initial component mount');
  t.ok(browserStub.calledWith('https://google.com'),
    'Redirect to query string-specified redirect URL on successful auth check');

  request.get.restore();
  browser.go.restore();
  t.end();
});

test('Invalid OTP login', (t) => {
  sinon.stub(request, 'get');
  const fingerprintStub = sinon.stub(Fingerprint.prototype, 'get', (cb) => cb('fingerprint'));
  const requestPostStub = sinon.stub(request, 'post', (opts, cb) => {
    t.equal(opts.url, '/api/login/otp', 'Endpoint for OTP login');
    t.equal(opts.json.otp, 'otp', 'OTP is passed as JSON parameter');
    t.equal(opts.json.fingerprint, 'fingerprint', 'Fingerprint is passed as JSON parameter');

    return cb(null, {statusCode: 403}, {message: 'error'});
  });

  jsdom.changeURL(window, 'https://auth.kevinlin.info/otp');
  const otp = mount(
    <OTP loading={loading} />
  );

  otp.instance().otpInput.setValue('otp');
  otp.find('.login-submit-btn').simulate('click');

  t.ok(requestPostStub.called, 'Login network request is made');
  t.ok(fingerprintStub.called, 'Attempt to get browser fingerprint');
  t.equal(otp.find('.login-error-alert').length, 1, 'Error alert is shown on failure');

  request.get.restore();
  request.post.restore();
  Fingerprint.prototype.get.restore();
  t.end();
});

test('Successful OTP login without redirect', (t) => {
  sinon.stub(request, 'get');
  const browserStub = sinon.stub(browser, 'push');
  const fingerprintStub = sinon.stub(Fingerprint.prototype, 'get', (cb) => cb('fingerprint'));
  const requestPostStub = sinon.stub(request, 'post', (opts, cb) => {
    t.equal(opts.url, '/api/login/otp', 'Endpoint for OTP login');
    t.equal(opts.json.otp, 'otp', 'OTP is passed as JSON parameter');
    t.equal(opts.json.fingerprint, 'fingerprint', 'Fingerprint is passed as JSON parameter');

    return cb(null, {statusCode: 200}, {});
  });

  jsdom.changeURL(window, 'https://auth.kevinlin.info/otp');
  const otp = mount(
    <OTP loading={loading} />
  );

  otp.instance().otpInput.setValue('otp');
  otp.find('.login-submit-btn').simulate('click');

  t.ok(requestPostStub.called, 'Login network request is made');
  t.ok(fingerprintStub.called, 'Attempt to get browser fingerprint');
  t.equal(otp.find('.login-error-alert').length, 0, 'No error alert is shown');
  t.ok(browserStub.calledWith('/status'), 'Redirect to status page on successful auth');

  request.get.restore();
  request.post.restore();
  browser.push.restore();
  Fingerprint.prototype.get.restore();
  t.end();
});

test('Successful OTP login with redirect', (t) => {
  sinon.stub(request, 'get');
  const browserStub = sinon.stub(browser, 'go');
  const fingerprintStub = sinon.stub(Fingerprint.prototype, 'get', (cb) => cb('fingerprint'));
  const requestPostStub = sinon.stub(request, 'post', (opts, cb) => {
    t.equal(opts.url, '/api/login/otp', 'Endpoint for OTP login');
    t.equal(opts.json.otp, 'otp', 'OTP is passed as JSON parameter');
    t.equal(opts.json.fingerprint, 'fingerprint', 'Fingerprint is passed as JSON parameter');

    return cb(null, {statusCode: 200}, {});
  });

  jsdom.changeURL(window, 'https://auth.kevinlin.info/otp?redirect=https://google.com');
  const otp = mount(
    <OTP loading={loading} />
  );

  otp.instance().otpInput.setValue('otp');
  otp.find('.login-submit-btn').simulate('click');

  t.ok(requestPostStub.called, 'Login network request is made');
  t.ok(fingerprintStub.called, 'Attempt to get browser fingerprint');
  t.equal(otp.find('.login-success-alert').length, 1, 'Success alert is shown');
  t.ok(browserStub.calledWith('https://google.com'),
    'Redirect to redirect URL on successful auth');

  request.get.restore();
  request.post.restore();
  browser.go.restore();
  Fingerprint.prototype.get.restore();
  t.end();
});
