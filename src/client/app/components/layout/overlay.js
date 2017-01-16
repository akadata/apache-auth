import React from 'react';

const Overlay = ({isLoading, children}) => (
  <div className="overlay-container" style={{
    opacity: isLoading ? 0.4 : 1,
    transition: 'all 0.3s ease'
  }}>
    {children}
  </div>
);

export default Overlay;
