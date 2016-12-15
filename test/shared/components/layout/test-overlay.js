import {mount} from 'enzyme';
import React from 'react';
import test from 'tape';

import Overlay from '../../../../src/shared/components/layout/overlay';

test('Overlay passes opacity to container', (t) => {
  const overlay = mount(
    <Overlay opacity={0.4}>
      children
    </Overlay>
  );

  const container = overlay.find('.overlay-container');

  t.equal(container.length, 1, 'Overlay container is present');
  t.equal(container.props().children, 'children', 'Children elements are wrapped');
  t.equal(container.props().style.opacity, 0.4, 'Opacity is applied as style on container element');

  t.end();
});
