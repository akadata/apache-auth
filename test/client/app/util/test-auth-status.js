import request from 'browser-request';
import sinon from 'sinon';
import test from 'tape';

import authStatus from '../../../../src/client/app/util/auth-status';
import browser from '../../../../src/client/app/util/browser';

const loading = (func) => func(() => {});

test('Redirect to URL if already authenticated', (t) => {
  const parseURLStub = sinon.stub(browser, 'parseURL').returns({
    query: {
      redirect: 'https://google.com'
    }
  });
  const goStub = sinon.stub(browser, 'go');
  const requestStub = sinon.stub(request, 'get', (opts, cb) => {
    t.equal(opts.url, '/auth-check', 'Authentication check URL is correct');

    return cb(null, {statusCode: 200});
  });

  authStatus.redirectIfAuthenticated(loading);

  t.ok(requestStub.called, 'Authentication check is performed');
  t.ok(parseURLStub.called, 'Attempt to parse current URL');
  t.ok(goStub.calledWith('https://google.com'), 'Redirect to foreign URL');

  request.get.restore();
  browser.parseURL.restore();
  browser.go.restore();
  t.end();
});

test('Redirect to status page if already authenticated', (t) => {
  const parseURLStub = sinon.stub(browser, 'parseURL').returns({
    query: {}
  });
  const pushStub = sinon.stub(browser, 'push');
  const requestStub = sinon.stub(request, 'get', (opts, cb) => {
    t.equal(opts.url, '/auth-check', 'Authentication check URL is correct');

    return cb(null, {statusCode: 200});
  });

  authStatus.redirectIfAuthenticated(loading);

  t.ok(requestStub.called, 'Authentication check is performed');
  t.ok(parseURLStub.called, 'Attempt to parse current URL');
  t.ok(pushStub.calledWith('/status'), 'Redirect to status page');

  request.get.restore();
  browser.parseURL.restore();
  browser.push.restore();
  t.end();
});

test('Errored authentication check translates to noop', (t) => {
  const requestStub = sinon.stub(request, 'get', (opts, cb) => {
    t.equal(opts.url, '/auth-check', 'Authentication check URL is correct');

    return cb('error');
  });

  authStatus.redirectIfAuthenticated(loading);

  t.ok(requestStub.called, 'Authentication check is performed');

  request.get.restore();
  t.end();
});
