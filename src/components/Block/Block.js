import React, { Component } from 'react';

import './Block.css';

export default class Block extends Component {
  render() {
    return (
      <div
        className={'block block-' + this.props.cols}
        style={{
          backgroundColor: this.props.bgcolor,
          borderColor: this.props.border
        }}
        onClick={(x, y) =>
          this.props.clickbox(this.props.xcoord, this.props.ycoord)
        }
      />
    );
  }
}
