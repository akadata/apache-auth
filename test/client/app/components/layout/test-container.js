import {mount} from 'enzyme';
import React from 'react';
import test from 'tape';

import Container from '../../../../../src/client/app/components/layout/container';

test('Container wraps children components', (t) => {
  const container = mount(
    <Container>
      children
    </Container>
  );

  t.equal(container.find('Logo').length, 1, 'Logo element is present');
  t.equal(container.find('.content-container').length, 1, 'Content container is present');
  t.equal(container.find('.content-container').props().children, 'children',
    'Children are wrapped');

  t.end();
});
