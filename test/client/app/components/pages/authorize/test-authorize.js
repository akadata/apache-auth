/* global window */

import jsdom from 'jsdom';
import {mount} from 'enzyme';
import React from 'react';
import request from 'browser-request';
import sinon from 'sinon';
import test from 'tape';

import authStatus from '../../../../../../src/client/app/util/auth-status';
import browser from '../../../../../../src/client/app/util/browser';
import {Authorize} from '../../../../../../src/client/app/components/pages/authorize';

const loading = (func) => func(() => {});

test('Authorize component rendering and initial auth request', (t) => {
  const clock = sinon.useFakeTimers();
  const goStub = sinon.stub(browser, 'go');
  const authCheckStub = sinon.stub(authStatus, 'redirectIfAuthenticated', (_, cb) => cb());
  const fingerprintStub = sinon.stub(browser, 'fingerprint', (cb) => cb('fingerprint'));
  const requestStub = sinon.stub(request, 'post', (opts, cb) => {
    t.equal(opts.url, '/api/login/authorize/request', 'Endpoint for auth request');

    return cb(null, {statusCode: 200});
  });

  jsdom.changeURL(window, 'https://auth.kevinlin.info/authorize?redirect=https://google.com');
  const authorize = mount(
    <Authorize loading={loading} />
  );

  t.ok(authCheckStub.called, 'Auth check on component mount');
  t.ok(fingerprintStub.called, 'Fingerprint is requested');
  t.ok(requestStub.called, 'Auth request is initiated');
  t.notOk(goStub.called, 'No page redirect immediately');
  t.ok(authorize.find('.authorize-status').length, 1, 'Authorization status is rendered');

  request.post.restore();
  sinon.stub(request, 'post', (opts, cb) => {
    t.equal(opts.url, '/api/login/authorize/check', 'Endpoint for auth request status check');

    return cb(null, {statusCode: 200});
  });

  clock.tick(1000);

  t.ok(goStub.calledWith('https://google.com'), 'Page redirect on successful auth request check');

  browser.fingerprint.restore();
  authStatus.redirectIfAuthenticated.restore();
  request.post.restore();
  browser.go.restore();
  clock.restore();
  t.end();
});

test('Error on absence of redirect URL', (t) => {
  const clock = sinon.useFakeTimers();
  const goStub = sinon.stub(browser, 'go');
  const authCheckStub = sinon.stub(authStatus, 'redirectIfAuthenticated', (_, cb) => cb());
  const fingerprintStub = sinon.stub(browser, 'fingerprint', (cb) => cb('fingerprint'));
  const requestStub = sinon.stub(request, 'post', (opts, cb) => {
    t.equal(opts.url, '/api/login/authorize/request', 'Endpoint for auth request');

    return cb(null, {statusCode: 200});
  });

  jsdom.changeURL(window, 'https://auth.kevinlin.info/authorize');
  const authorize = mount(
    <Authorize loading={loading} />
  );

  t.ok(authCheckStub.called, 'Auth check on component mount');
  t.notOk(fingerprintStub.called, 'Fingerprint is not requested');
  t.notOk(requestStub.called, 'Auth request is not initiated');
  t.notOk(goStub.called, 'No page redirect immediately');
  t.ok(authorize.find('.authorize-status').length, 1, 'Authorization status is rendered');

  request.post.restore();
  sinon.stub(request, 'post', (opts, cb) => {
    t.equal(opts.url, '/api/login/authorize/check', 'Endpoint for auth request status check');

    return cb(null, {statusCode: 200});
  });

  clock.tick(1000);

  t.notOk(goStub.called, 'No page redirect is possible');

  browser.fingerprint.restore();
  authStatus.redirectIfAuthenticated.restore();
  request.post.restore();
  browser.go.restore();
  clock.restore();
  t.end();
});

test('Failed initial authorization request', (t) => {
  const clock = sinon.useFakeTimers();
  const goStub = sinon.stub(browser, 'go');
  const authCheckStub = sinon.stub(authStatus, 'redirectIfAuthenticated', (_, cb) => cb());
  const fingerprintStub = sinon.stub(browser, 'fingerprint', (cb) => cb('fingerprint'));
  const requestStub = sinon.stub(request, 'post', (opts, cb) => {
    t.equal(opts.url, '/api/login/authorize/request', 'Endpoint for auth request');

    return cb(null, {statusCode: 500});
  });

  jsdom.changeURL(window, 'https://auth.kevinlin.info/authorize?redirect=https://google.com');
  const authorize = mount(
    <Authorize loading={loading} />
  );

  t.ok(authCheckStub.called, 'Auth check on component mount');
  t.ok(fingerprintStub.called, 'Fingerprint is requested');
  t.ok(requestStub.called, 'Auth request is initiated');
  t.notOk(goStub.called, 'No page redirect immediately');
  t.ok(authorize.find('.authorize-status').length, 1, 'Authorization status is rendered');

  request.post.restore();
  sinon.stub(request, 'post', (opts, cb) => {
    t.equal(opts.url, '/api/login/authorize/check', 'Endpoint for auth request status check');

    return cb(null, {statusCode: 200});
  });

  clock.tick(1000);

  t.notOk(goStub.called, 'No attempt to proceed in authorization check');

  browser.fingerprint.restore();
  authStatus.redirectIfAuthenticated.restore();
  request.post.restore();
  browser.go.restore();
  clock.restore();
  t.end();
});
