import React from 'react';

const Overlay = ({opacity, children}) => (
  <div style={{
    opacity: opacity,
    transition: 'all 0.3s ease'
  }}>
    {children}
  </div>
);

export default Overlay;
