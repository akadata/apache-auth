import {mount} from 'enzyme';
import React from 'react';
import test from 'tape';

import Blacklist from '../../../../../../src/client/app/components/pages/blacklist';

test('Blacklist rendering', (t) => {
  const blacklist = mount(
    <Blacklist />
  );

  t.equal(blacklist.find('Alert').length, 1, 'Error alert is present');

  t.end();
});
