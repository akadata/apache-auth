import {browserHistory} from 'react-router';
import {mount} from 'enzyme';
import React from 'react';
import sinon from 'sinon';
import test from 'tape';

import Logo from '../../../../src/shared/components/layout/logo';

test('Logo routing on-click behavior', (t) => {
  const historyStub = sinon.stub(browserHistory, 'push');
  const logo = mount(
    <Logo />
  );

  t.equal(logo.find('.logo').length, 1, 'Logo element is present');
  t.notOk(historyStub.called, 'No routing before click');
  logo.find('.logo').simulate('click');
  t.ok(historyStub.calledWith('/login'), 'Logo click routes to login page');

  browserHistory.push.restore();
  t.end();
});
