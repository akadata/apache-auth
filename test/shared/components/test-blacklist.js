import {mount} from 'enzyme';
import React from 'react';
import test from 'tape';

import Blacklist from '../../../src/shared/components/blacklist';

test('Blacklist rendering', (t) => {
  const blacklist = mount(
    <Blacklist />
  );

  t.equal(blacklist.find('Container').length, 1, 'Container is present');
  t.equal(blacklist.find('.blacklist-alert').length, 1, 'Blacklist alert is present');

  t.end();
});
