import React from 'react';

import browser from '../../util/browser';

const Logo = (props) => {
  const onLogoClick = (evt) => browser.push('/login');

  return (
    <div {...props}>
      <div className="logo text-center" onClick={onLogoClick}>
        <div className="bg-gray-70" style={{
          height: 35,
          width: 15,
          display: 'inline-block'
        }} />
        <div className="sans-serif semibold epsilon text-gray-70" style={{
          marginLeft: 25,
          display: 'inline-block'
        }}>
          KEVIN LIN
        </div>
      </div>
    </div>
  );
};

export default Logo;
