import {mount} from 'enzyme';
import React from 'react';
import test from 'tape';

import AppRoot from '../../../src/shared/components/app-root';

test('App root wraps children elements', (t) => {
  const app = mount(
    <AppRoot>
      children
    </AppRoot>
  );

  t.equal(app.find('.app-root').length, 1, 'Container is present');
  t.equal(app.find('.app-root').props().children, 'children', 'Children are wrapped in container');

  t.end();
});
