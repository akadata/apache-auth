import React from 'react';

import Logo from './logo';

export default class Container extends React.Component {
  render() {
    return (
      <div className="container-box bg-white">
        <Logo className="margin-huge--bottom" />
        <div className="content-container">
          {this.props.children}
        </div>
      </div>
    );
  }
}
