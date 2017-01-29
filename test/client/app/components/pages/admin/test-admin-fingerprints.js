import Fingerprint from 'fingerprintjs2';
import {mount} from 'enzyme';
import React from 'react';
import request from 'browser-request';
import sinon from 'sinon';
import test from 'tape';

import AdminFingerprints
  from '../../../../../../src/client/app/components/pages/admin/admin-fingerprints';

const loading = (func) => func(() => {});

test('Failure to load browser fingerprints', (t) => {
  const requestStub = sinon.stub(request, 'get', (opts, cb) => {
    t.equal(opts.url, '/api/admin/fingerprint/list', 'Endpoint is correct');
    t.deepEqual(opts.json, {}, 'No JSON body');

    return cb(null, {statusCode: 500}, {error: 'error'});
  });

  const fingerprints = mount(
    <AdminFingerprints
      loading={loading}
      isLoading={true}
    />
  );

  t.ok(requestStub.called, 'Attempt to fetch blacklist entries on mount');
  t.equal(fingerprints.find('.fingerprints-error-alert').length, 1, 'Error alert is displayed');

  request.get.restore();
  t.end();
});

test('Browser fingerprints are loaded on mount', (t) => {
  const requestStub = sinon.stub(request, 'get', (opts, cb) => {
    t.equal(opts.url, '/api/admin/fingerprint/list', 'Endpoint is correct');
    t.deepEqual(opts.json, {}, 'No JSON body');

    return cb(null, {statusCode: 200}, {fingerprints: [1]});
  });

  const fingerprints = mount(
    <AdminFingerprints
      loading={loading}
      isLoading={true}
    />
  );

  t.ok(requestStub.called, 'Attempt to fetch blacklist entries on mount');
  t.deepEqual(fingerprints.state().fingerprints, [1],
    'Component state is updated with fingerprints');

  request.get.restore();
  t.end();
});

test('Adding a new trusted browser fingerprint', (t) => {
  sinon.stub(request, 'get');
  const fingerprintStub = sinon.stub(Fingerprint.prototype, 'get', (cb) => cb('fingerprint'));
  const requestStub = sinon.stub(request, 'put', (opts, cb) => {
    t.equal(opts.url, '/api/admin/fingerprint/add', 'Endpoint is correct');
    t.deepEqual(opts.json, {
      name: 'name',
      fingerprint: 'fingerprint',
      username: null
    }, 'JSON body is correct');

    return cb(null, {statusCode: 200});
  });

  const fingerprints = mount(
    <AdminFingerprints
      loading={loading}
      isLoading={true}
    />
  );

  fingerprints.instance().browserName.setValue('name');
  fingerprints.find('.trust-browser-btn').simulate('click');
  fingerprints.find('.trust-browser-btn').simulate('mouseOut');

  t.ok(fingerprintStub.called, 'Attempt to calculate browser fingerprint');
  t.ok(requestStub.called, 'Attempt to add browser fingerprint');

  request.get.restore();
  request.put.restore();
  Fingerprint.prototype.get.restore();
  t.end();
});

test('Revoking an existing fingerprint', (t) => {
  // browser-request exposes 'get' and 'post' as additional properties of the default-exported
  // 'request' object as any reasonable library would do but for whatever stupid reason doesn't
  // export other HTTP verbs like DELETE as request.delete. In building semantically meaningful
  // RESTful APIs, the fingerprint revocation endpoint requires the DELETE verb, but the only way
  // to achieve this is to invoke the default-exported request object as a function, passing
  // 'DELETE' as an option. This of course makes it 623478923x harder to stub out the function
  // since sinon can't natively stub top-level exports, so I need to resort to doing all kinds of
  // crazy shit using rewire just to test this goddamn endpoint

  // The maintainer of browser-request also hasn't accepted a PR since 2014 so rip trying to fix
  // this bullshit upstream, too

  const requestStub = (opts, cb) => {
    t.equal(opts.url, '/api/admin/fingerprint/revoke', 'Endpoint is correct');
    t.equal(opts.method, 'DELETE', 'DELETE verb is specified for revocation');
    t.deepEqual(opts.json, {id: 'id'}, 'JSON request body is correct');

    return cb();
  };
  requestStub.get = (opts, cb) => cb(null, {statusCode: 200}, {fingerprints: [
    {
      _id: 'id',
      name: 'name',
      fingerprint: 'fingerprint'
    }
  ]});

  AdminFingerprints.__Rewire__('request', requestStub);
  const fingerprints = mount(
    <AdminFingerprints
      loading={loading}
      isLoading={true}
    />
  );

  t.equal(fingerprints.find('.fingerprint-revoke-btn').length, 1, 'One fingerprint is available');
  fingerprints.find('.fingerprint-revoke-btn').simulate('click');

  AdminFingerprints.__ResetDependency__('request');
  t.end();
});
