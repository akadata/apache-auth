import ReactDOM from 'react-dom';
import sinon from 'sinon';
import test from 'tape';

test('Blacklist SPA is rendered', (t) => {
  const renderStub = sinon.stub(ReactDOM, 'render');

  require('../../../src/client/scripts/blacklist');

  t.ok(renderStub.called, 'Blacklist is rendered in script');

  ReactDOM.render.restore();
  t.end();
});
