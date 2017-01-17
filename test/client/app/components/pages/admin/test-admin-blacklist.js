import {mount} from 'enzyme';
import React from 'react';
import request from 'browser-request';
import sinon from 'sinon';
import test from 'tape';

import AdminBlacklist
  from '../../../../../../src/client/app/components/pages/admin/admin-blacklist';
import browser from '../../../../../../src/client/app/util/browser';

const loading = (func) => func(() => {});

test('Unauthorized attempt to load blacklist entries', (t) => {
  const browserPushStub = sinon.stub(browser, 'push');
  const requestStub = sinon.stub(request, 'get', (opts, cb) => {
    t.equal(opts.url, '/api/admin/blacklist/list', 'Endpoint is correct');
    t.deepEqual(opts.json, {}, 'No JSON body');

    return cb(null, {statusCode: 403});
  });
  const blacklist = mount(
    <AdminBlacklist
      loading={loading}
      isLoading={true}
    />
  );

  t.ok(requestStub.called, 'Attempt to fetch blacklist entries on mount');
  t.ok(browserPushStub.calledWith('/login'), 'Redirect to login');
  t.equal(blacklist.find('.admin-error-alert').length, 1, 'Error alert is displayed');

  browser.push.restore();
  request.get.restore();
  t.end();
});

test('Blacklist entries are loaded on mount', (t) => {
  const browserPushStub = sinon.stub(browser, 'push');
  const requestStub = sinon.stub(request, 'get', (opts, cb) => {
    t.equal(opts.url, '/api/admin/blacklist/list', 'Endpoint is correct');
    t.deepEqual(opts.json, {}, 'No JSON body');

    return cb(null, {statusCode: 200}, {entries: [1]});
  });
  const blacklist = mount(
    <AdminBlacklist
      loading={loading}
      isLoading={true}
    />
  );

  t.ok(requestStub.called, 'Attempt to fetch blacklist entries on mount');
  t.notOk(browserPushStub.called, 'No attempt to redirect to login');
  t.deepEqual(blacklist.state().blacklistEntries, [1], 'Component state is updated with blacklist');

  browser.push.restore();
  request.get.restore();
  t.end();
});
