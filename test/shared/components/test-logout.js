/* global setTimeout */

import {mount} from 'enzyme';
import React from 'react';
import request from 'browser-request';
import sinon from 'sinon';
import test from 'tape';

import Logout from '../../../src/shared/components/logout';

test('Unsuccessful call to Apache logout endpoint on mount', (t) => {
  const clock = sinon.useFakeTimers();
  const requestStub = sinon.stub(request, 'post', (opts, cb) => {
    t.equal(opts.url, '/api/logout', 'Logout API endpoint is correct');

    // Simulate a 1000 ms network delay
    setTimeout(() => cb({}, {
      statusCode: 500
    }), 1000);
  });

  const logout = mount(
    <Logout />
  );

  // Request in-flight
  t.ok(requestStub.called, 'Request is made on mount');
  t.deepEqual(logout.state(), {}, 'State is initially empty');

  // Request completed
  clock.tick(1005);
  t.equal(logout.state().status, 500, 'Status code is set in component state');
  t.equal(logout.find('.logout-success-alert').length, 0, 'Success is not displayed');
  t.equal(logout.find('.logout-error-alert').length, 1, 'Error is displayed');

  request.post.restore();
  clock.restore();
  t.end();
});

test('Successful call to Apache logout endpoint on mount', (t) => {
  const clock = sinon.useFakeTimers();
  const requestStub = sinon.stub(request, 'post', (opts, cb) => {
    t.equal(opts.url, '/api/logout', 'Logout API endpoint is correct');

    // Simulate a 1000 ms network delay
    setTimeout(() => cb(null, {
      statusCode: 200
    }), 1000);
  });

  const logout = mount(
    <Logout />
  );

  // Request in-flight
  t.ok(requestStub.called, 'Request is made on mount');
  t.deepEqual(logout.state(), {}, 'State is initially empty');

  // Request completed
  clock.tick(1005);
  t.equal(logout.state().status, 200, 'Status code is set in component state');
  t.equal(logout.find('.logout-success-alert').length, 1, 'Success is displayed');
  t.equal(logout.find('.logout-error-alert').length, 0, 'Error is not displayed');

  request.post.restore();
  clock.restore();
  t.end();
});
