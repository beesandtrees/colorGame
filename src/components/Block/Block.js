import React from 'react';

import './Block.css';

const Block = props => {
  return (
    <div
      className={'block block-' + props.cols}
      style={{
        backgroundColor: props.bgcolor,
        borderColor: props.border
      }}
      onClick={(x, y) => props.clickbox(props.xcoord, props.ycoord)}
    />
  );
};

export default Block;
