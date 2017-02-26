import {mount} from 'enzyme';
import React from 'react';
import request from 'browser-request';
import sinon from 'sinon';
import test from 'tape';

import {
  ALERT_TYPE_ERROR,
  ALERT_TYPE_SUCCESS
} from '../../../../../../../src/client/app/components/ui/alert';
import {AdminAuthorize} from '../../../../../../../src/client/app/components/pages/admin/authorize';

const loading = (func) => func(() => {});

test('Admin authorization fetches request details on mount successfully', (t) => {
  const requestStub = sinon.stub(request, 'post', (opts, cb) => {
    t.equal(opts.url, '/api/admin/authorize/details', 'Endpoint is correct');
    t.equal(opts.json.authorizationID, 1, 'Authorization ID is passed from URL param');

    return cb(null, {statusCode: 200}, {details: {juicy: true}});
  });

  const admin = mount(
    <AdminAuthorize
      loading={loading}
      isLoading={true}
      params={{authorizationID: 1}}
    />
  );

  t.ok(requestStub.called, 'Details are fetched on mount');
  t.deepEqual(admin.state().details, {juicy: true}, 'Details are added to component state');

  request.post.restore();
  t.end();
});

test('Failed network request for request details', (t) => {
  const requestStub = sinon.stub(request, 'post', (opts, cb) => {
    t.equal(opts.url, '/api/admin/authorize/details', 'Endpoint is correct');
    t.equal(opts.json.authorizationID, 1, 'Authorization ID is passed from URL param');

    return cb('error');
  });

  const admin = mount(
    <AdminAuthorize
      loading={loading}
      isLoading={true}
      params={{authorizationID: 1}}
    />
  );

  t.ok(requestStub.called, 'Details are fetched on mount');
  t.deepEqual(admin.state().status, {
    type: ALERT_TYPE_ERROR,
    title: 'Error fetching authorization details!',
    message: 'Please try again.'
  }, 'Error is reported');

  request.post.restore();
  t.end();
});

test('Successful short authorization grant', (t) => {
  sinon.stub(request, 'post', (opts, cb) => {
    t.equal(opts.url, '/api/admin/authorize/details', 'Endpoint is correct');
    t.equal(opts.json.authorizationID, 1, 'Authorization ID is passed from URL param');

    return cb(null, {statusCode: 200}, {details: {juicy: true}});
  });

  const admin = mount(
    <AdminAuthorize
      loading={loading}
      isLoading={true}
      params={{authorizationID: 1}}
    />
  );

  request.post.restore();
  const requestStub = sinon.stub(request, 'post', (opts, cb) => {
    t.equal(opts.url, '/api/admin/authorize/grant', 'Endpoint is correct');
    t.equal(opts.json.authorizationID, 1, 'Authorization ID is passed from URL param');
    t.equal(opts.json.duration, 1, 'Default short duration is 1 minute');

    return cb(null, {statusCode: 200});
  });

  admin.find('.authorize-short-submit-btn').simulate('click');

  t.ok(requestStub.called, 'Authorization is granted');

  request.post.restore();
  t.end();
});

test('Successful long authorization grant', (t) => {
  sinon.stub(request, 'post', (opts, cb) => {
    t.equal(opts.url, '/api/admin/authorize/details', 'Endpoint is correct');
    t.equal(opts.json.authorizationID, 1, 'Authorization ID is passed from URL param');

    return cb(null, {statusCode: 200}, {details: {juicy: true}});
  });

  const admin = mount(
    <AdminAuthorize
      loading={loading}
      isLoading={true}
      params={{authorizationID: 1}}
    />
  );

  request.post.restore();
  const requestStub = sinon.stub(request, 'post', (opts, cb) => {
    t.equal(opts.url, '/api/admin/authorize/grant', 'Endpoint is correct');
    t.equal(opts.json.authorizationID, 1, 'Authorization ID is passed from URL param');
    t.equal(opts.json.duration, 30, 'Default long duration is 30 minutes');

    return cb(null, {statusCode: 200});
  });

  admin.find('.authorize-long-submit-btn').simulate('click');

  t.ok(requestStub.called, 'Authorization is granted');

  request.post.restore();
  t.end();
});

test('Failed long authorization grant', (t) => {
  sinon.stub(request, 'post', (opts, cb) => {
    t.equal(opts.url, '/api/admin/authorize/details', 'Endpoint is correct');
    t.equal(opts.json.authorizationID, 1, 'Authorization ID is passed from URL param');

    return cb(null, {statusCode: 200}, {details: {juicy: true}});
  });

  const admin = mount(
    <AdminAuthorize
      loading={loading}
      isLoading={true}
      params={{authorizationID: 1}}
    />
  );

  request.post.restore();
  const requestStub = sinon.stub(request, 'post', (opts, cb) => {
    t.equal(opts.url, '/api/admin/authorize/grant', 'Endpoint is correct');
    t.equal(opts.json.authorizationID, 1, 'Authorization ID is passed from URL param');
    t.equal(opts.json.duration, 30, 'Default long duration is 30 minutes');

    return cb('error', null, {message: 'message'});
  });

  admin.find('.authorize-long-submit-btn').simulate('click');

  t.ok(requestStub.called, 'Authorization is granted');
  t.deepEqual(admin.state().status, {
    type: ALERT_TYPE_ERROR,
    title: 'There was an error authorizing this request.',
    message: 'message'
  }, 'State is updated to reflect failure');

  request.post.restore();
  t.end();
});

test('Failed authorization rejection', (t) => {
  sinon.stub(request, 'post', (opts, cb) => {
    t.equal(opts.url, '/api/admin/authorize/details', 'Endpoint is correct');
    t.equal(opts.json.authorizationID, 1, 'Authorization ID is passed from URL param');

    return cb(null, {statusCode: 200}, {details: {juicy: true}});
  });

  const admin = mount(
    <AdminAuthorize
      loading={loading}
      isLoading={true}
      params={{authorizationID: 1}}
    />
  );

  request.post.restore();
  const requestStub = sinon.stub(request, 'post', (opts, cb) => {
    t.equal(opts.url, '/api/admin/authorize/reject', 'Endpoint is correct');
    t.equal(opts.json.authorizationID, 1, 'Authorization ID is passed from URL param');

    return cb('error', null, {message: 'message'});
  });

  admin.find('.reject-submit-btn').simulate('click');

  t.ok(requestStub.called, 'Authorization is granted');
  t.deepEqual(admin.state().status, {
    type: ALERT_TYPE_ERROR,
    title: 'There was an error rejecting this request.',
    message: 'message'
  }, 'State is updated to reflect failure');

  request.post.restore();
  t.end();
});

test('Successful authorization rejection', (t) => {
  sinon.stub(request, 'post', (opts, cb) => {
    t.equal(opts.url, '/api/admin/authorize/details', 'Endpoint is correct');
    t.equal(opts.json.authorizationID, 1, 'Authorization ID is passed from URL param');

    return cb(null, {statusCode: 200}, {details: {juicy: true}});
  });

  const admin = mount(
    <AdminAuthorize
      loading={loading}
      isLoading={true}
      params={{authorizationID: 1}}
    />
  );

  request.post.restore();
  const requestStub = sinon.stub(request, 'post', (opts, cb) => {
    t.equal(opts.url, '/api/admin/authorize/reject', 'Endpoint is correct');
    t.equal(opts.json.authorizationID, 1, 'Authorization ID is passed from URL param');

    return cb(null, {statusCode: 200});
  });

  admin.find('.reject-submit-btn').simulate('click');

  t.ok(requestStub.called, 'Authorization is granted');
  t.deepEqual(admin.state().status, {
    type: ALERT_TYPE_SUCCESS,
    title: 'Request rejected and IP blacklisted.',
    message: 'Further login attempts from this IP are blacklisted.'
  }, 'State is updated to reflect success');

  request.post.restore();
  t.end();
});
