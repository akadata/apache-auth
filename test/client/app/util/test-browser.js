import {browserHistory} from 'react-router';
import jsdom from 'jsdom';
import sinon from 'sinon';
import test from 'tape';

import browser from '../../../../src/client/app/util/browser';

test('browser.go after a delay', (t) => {
  const clock = sinon.useFakeTimers();

  const id = browser.go('https://google.com', 100);
  clock.tick(1000);

  t.ok(id >= 0, 'Procedure returns a timeout ID');

  clock.restore();
  t.end();
});

test('browser.push after a delay', (t) => {
  const browserHistoryStub = sinon.stub(browserHistory, 'push');
  const clock = sinon.useFakeTimers();

  const id = browser.push('/path', 100);
  clock.tick(1000);

  t.ok(id >= 0, 'Procedure returns a timeout ID');
  t.ok(browserHistoryStub.calledWith('/path'), 'Browser history state is modified');

  clock.restore();
  browserHistory.push.restore();
  t.end();
});

test('browser.clearTimeout is a direct proxy to the window method', (t) => {
  const windowStub = sinon.stub(window, 'clearTimeout');

  browser.clearTimeout(1);

  t.ok(windowStub.called, 'Window global clearTimeout is called');

  window.clearTimeout.restore();
  t.end();
});

test('browser.parseURL parses current URL with query string', (t) => {
  jsdom.changeURL(window, 'https://auth.kevinlin.info?redirect=https://google.com');

  const parsed = browser.parseURL();

  t.equal(parsed.host, 'auth.kevinlin.info', 'Host is parsed');
  t.equal(parsed.query.redirect, 'https://google.com', 'Query string redirect is parsed');

  t.end();
});
