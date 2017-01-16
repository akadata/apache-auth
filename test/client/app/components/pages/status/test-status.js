import {mount} from 'enzyme';
import React from 'react';
import request from 'browser-request';
import sinon from 'sinon';
import test from 'tape';

import Status from '../../../../../../src/client/app/components/pages/status';

test('Authenticated session', (t) => {
  const requestStub = sinon.stub(request, 'get', (opts, cb) => {
    cb(null, {
      statusCode: 200
    });
  });
  const status = mount(
    <Status />
  );

  t.equal(status.find('.session-authenticated').length, 1, 'Session is authenticated');
  t.equal(status.find('.session-not-authenticated').length, 0, 'Error is not displayed');
  t.ok(requestStub.called, 'Request is made on componentDidMount');

  request.get.restore();
  t.end();
});

test('Not authenticated session', (t) => {
  const requestStub = sinon.stub(request, 'get', (opts, cb) => {
    cb(null, {
      statusCode: 403
    });
  });
  const status = mount(
    <Status />
  );

  t.equal(status.find('.session-authenticated').length, 0, 'Success is not displayed');
  t.equal(status.find('.session-not-authenticated').length, 1, 'Session is not authenticated');
  t.ok(requestStub.called, 'Request is made on componentDidMount');

  request.get.restore();
  t.end();
});