/* global setTimeout */

import {browserHistory} from 'react-router';
import humanize from 'humanize';
import {mount} from 'enzyme';
import React from 'react';
import request from 'browser-request';
import sinon from 'sinon';
import test from 'tape';

import Admin from '../../../src/shared/components/admin';

test('Unsuccessful query to blacklist entries API on mount', (t) => {
  const clock = sinon.useFakeTimers();
  const historyStub = sinon.stub(browserHistory, 'push');
  const requestStub = sinon.stub(request, 'post', (opts, cb) => {
    t.equal(opts.url, '/api/blacklist-entries', 'POSTed API endpoint is correct');
    t.deepEqual(opts.json, {}, 'Empty JSON body is passed');

    // Simulate a 1000 ms network delay
    setTimeout(() => cb({}), 1000);
  });

  const admin = mount(
    <Admin />
  );

  // Request in-flight
  t.ok(requestStub.called, 'Request is made on mount');
  t.ok(admin.state().isLoading, 'Component isLoading is initially true');
  t.notOk(admin.state().errorMessage, 'No error message initially');
  t.deepEqual(admin.state().blacklistEntries, [], 'Blacklist entries are initially empty');

  // Request completed
  clock.tick(1005);
  t.notOk(admin.state().isLoading, 'Component isLoading state is falsified');
  t.ok(admin.state().errorMessage, 'Error message is set');

  // Redirect initiated
  clock.tick(9000);
  t.ok(historyStub.calledWith('/login'), 'Redirect to login on error');
  t.equal(admin.find('.blacklist-error').length, 1, 'Blacklist error alert is displayed');

  request.post.restore();
  browserHistory.push.restore();
  clock.restore();
  t.end();
});

test('Successful query to blacklist entries API on mount', (t) => {
  const entries = [
    {
      ip: '127.0.0.1',
      count: 1,
      expiry: 1481764450
    },
    {
      ip: '192.168.1.1',
      count: 10,
      expiry: 1480764450
    },
    {
      ip: '10.0.0.1',
      count: 5,
      expiry: 1481764450
    }
  ];

  const clock = sinon.useFakeTimers(1481774451942);
  const requestStub = sinon.stub(request, 'post', (opts, cb) => {
    t.equal(opts.url, '/api/blacklist-entries', 'POSTed API endpoint is correct');
    t.deepEqual(opts.json, {}, 'Empty JSON body is passed');

    // Simulate a 1000 ms network delay
    setTimeout(() => cb(null, {
      statusCode: 200
    }, {
      entries: entries
    }), 1000);
  });

  const admin = mount(
    <Admin />
  );

  // Request in-flight
  t.ok(requestStub.called, 'Request is made on mount');
  t.ok(admin.state().isLoading, 'Component isLoading is initially true');
  t.notOk(admin.state().errorMessage, 'No error message initially');
  t.deepEqual(admin.state().blacklistEntries, [], 'Blacklist entries are initially empty');

  // Request completed
  clock.tick(1005);
  t.notOk(admin.state().isLoading, 'Component isLoading state is falsified');
  t.notOk(admin.state().errorMessage, 'Still no error message');
  t.deepEqual(admin.state().blacklistEntries, entries,
    'Blacklist entries are loaded into component state');
  t.equal(admin.find('.blacklist-error').length, 0, 'Blacklist error alert is not displayed');
  t.equal(admin.find('.blacklist-entry').length, entries.length,
    'Number of rendered entries is correct');
  admin.find('.blacklist-entry').forEach((entry, entryIdx) => {
    const expect = entries[entryIdx];

    t.equal(entry.childAt(0).props().children, expect.ip, 'Reproduced IP is correct');
    t.equal(entry.childAt(1).props().children, expect.count, 'Reproduced count is correct');
    t.equal(entry.childAt(2).props().children, humanize.relativeTime(expect.expiry),
      'Reproduced timestamp is correct');
  });

  request.post.restore();
  clock.restore();
  t.end();
});
