import {shallow} from 'enzyme';
import React from 'react';
import test from 'tape';

import {Admin} from '../../../../../../src/client/app/components/pages/admin';

test('Admin wraps blacklist and fingerprints', (t) => {
  const admin = shallow(
    <Admin isLoading={true} />
  );

  t.equal(admin.find('AdminBlacklist').length, 1, 'AdminBlacklist is rendered');
  t.equal(admin.find('AdminFingerprints').length, 1, 'AdminFingerprints is rendered');

  t.end();
});
