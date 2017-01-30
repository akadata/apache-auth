/* global window */

import jsdom from 'jsdom';
import {mount, shallow} from 'enzyme';
import React from 'react';
import request from 'browser-request';
import sinon from 'sinon';
import test from 'tape';

import authStatus from '../../../../../../src/client/app/util/auth-status';
import browser from '../../../../../../src/client/app/util/browser';
import {U2F} from '../../../../../../src/client/app/components/pages/u2f';

const loading = (func) => func(() => {});

test('U2F component rendering and initial auth challenge request', (t) => {
  const authCheckStub = sinon.stub(authStatus, 'redirectIfAuthenticated');
  const fingerprintStub = sinon.stub(browser, 'fingerprint', (cb) => cb('fingerprint'));
  const requestStub = sinon.stub(request, 'post', (opts, cb) => {
    t.equal(opts.url, '/api/login/u2f/challenge', 'Endpoint for auth challenge request');

    return cb(null, {statusCode: 200});
  });

  jsdom.changeURL(window, 'https://auth.kevinlin.info/u2f');
  const u2f = mount(
    <U2F loading={loading} />
  );

  t.ok(authCheckStub.called, 'Auth check on component mount');
  t.ok(fingerprintStub.called, 'Fingerprint is requested');
  t.ok(requestStub.called, 'Auth challenge is initiated');
  t.equal(u2f.find('.u2f-progress').length, 1, 'UI elements are rendered');
  t.equal(u2f.state().u2fStatus, 'statusWaiting', 'U2F is in a waiting state');

  browser.fingerprint.restore();
  authStatus.redirectIfAuthenticated.restore();
  request.post.restore();
  t.end();
});

test('Errored auth challenge request', (t) => {
  const authCheckStub = sinon.stub(authStatus, 'redirectIfAuthenticated');
  const fingerprintStub = sinon.stub(browser, 'fingerprint', (cb) => cb('fingerprint'));
  const requestStub = sinon.stub(request, 'post', (opts, cb) => {
    t.equal(opts.url, '/api/login/u2f/challenge', 'Endpoint for auth challenge request');

    return cb('error');
  });

  jsdom.changeURL(window, 'https://auth.kevinlin.info/u2f');
  const u2f = mount(
    <U2F loading={loading} />
  );

  t.ok(authCheckStub.called, 'Auth check on component mount');
  t.ok(fingerprintStub.called, 'Fingerprint is requested');
  t.ok(requestStub.called, 'Auth challenge is initiated');
  t.equal(u2f.find('.u2f-progress').length, 1, 'UI elements are rendered');
  t.equal(u2f.state().u2fStatus, 'statusError', 'U2F is in an error state');

  browser.fingerprint.restore();
  authStatus.redirectIfAuthenticated.restore();
  request.post.restore();
  t.end();
});

test('Unsuccessful U2F signing and verification', (t) => {
  const fingerprintStub = sinon.stub(browser, 'fingerprint', (cb) => cb('fingerprint'));
  const requestStub = sinon.stub(request, 'post', (opts, cb) => {
    t.equal(opts.url, '/api/login/u2f/verify', 'Endpoint for auth challenge request');
    t.deepEqual(opts.json, {
      fingerprint: 'fingerprint',
      authResponse: 'auth response'
    }, 'JSON data in verification is correct');

    return cb('error');
  });

  jsdom.changeURL(window, 'https://auth.kevinlin.info/u2f');
  const u2f = shallow(
    <U2F loading={loading} />
  );
  u2f.instance().onU2FSign('auth response');

  t.ok(fingerprintStub.called, 'Fingerprint is requested');
  t.ok(requestStub.called, 'Auth challenge is initiated');
  t.equal(u2f.state().u2fStatus, 'statusError', 'Unsuccessful verification');

  browser.fingerprint.restore();
  request.post.restore();
  t.end();
});

test('Successful U2F signing and verification', (t) => {
  const pushStub = sinon.stub(browser, 'push');
  const fingerprintStub = sinon.stub(browser, 'fingerprint', (cb) => cb('fingerprint'));
  const requestStub = sinon.stub(request, 'post', (opts, cb) => {
    t.equal(opts.url, '/api/login/u2f/verify', 'Endpoint for auth challenge request');
    t.deepEqual(opts.json, {
      fingerprint: 'fingerprint',
      authResponse: 'auth response'
    }, 'JSON data in verification is correct');

    return cb(null, {statusCode: 200}, {success: true});
  });

  jsdom.changeURL(window, 'https://auth.kevinlin.info/u2f');
  const u2f = shallow(
    <U2F loading={loading} />
  );
  u2f.instance().onU2FSign('auth response');

  t.ok(fingerprintStub.called, 'Fingerprint is requested');
  t.ok(requestStub.called, 'Auth challenge is initiated');
  t.equal(u2f.state().u2fStatus, 'statusDone', 'Successful verification');
  t.ok(pushStub.calledWith('/status'), 'Redirection to status page on completion');

  browser.fingerprint.restore();
  browser.push.restore();
  request.post.restore();
  t.end();
});
