import React from 'react';

import Logo from './logo';

const Container = ({children}) => (
  <div className="container-box bg-white">
    <Logo className="margin-huge--bottom" />
    <div className="content-container">
      {children}
    </div>
  </div>
);

export default Container;
