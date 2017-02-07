import {mount} from 'enzyme';
import React from 'react';
import test from 'tape';

import AppRoot from '../../../../src/client/app/components/app-root';

test('App root wraps children elements', (t) => {
  const app = mount(
    <AppRoot>
      children
    </AppRoot>
  );

  t.equal(app.find('.app-root').length, 1, 'Container is present');
  t.equal(app.find('Favicon').length, 1, 'App-wide favicon is present');

  t.end();
});
