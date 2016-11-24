import React from 'react';

import Logo from './logo';

export default class Container extends React.Component {
  render() {
    return (
      <div className="container-box bg-white">
        <div className="logo-container bg-gray-90">
          <Logo style={{
            paddingTop: 25
          }} />
        </div>
        <div className="content-container">
          {this.props.children}
        </div>
      </div>
    );
  }
}
