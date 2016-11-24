/* eslint-disable react/self-closing-comp */

import React from 'react';

export default class Logo extends React.Component {
  static propTypes = {
    className: React.PropTypes.string,
    style: React.PropTypes.object
  };

  render() {
    return (
      <div className="text-center" style={this.props.style}>
        <div className={`bg-gray-10 ${this.props.className}`} style={{
          height: 35,
          width: 15,
          display: 'inline-block'
        }}></div>
        <div className="sans-serif gamma text-gray-10" style={{
          marginLeft: 25,
          display: 'inline-block'
        }}>
          KEVIN LIN
        </div>
      </div>
    );
  }
}
