import React from 'react';
import { winText } from '../../helpers/constants.js';
import { rand } from '../../helpers/helpers.js';

import './WinLose.css';

const WinLose = props => {
  let winner = props.won;
  let winLen = winText.length;
  let classes = '',
    resultsText;

  if (winner === true) {
    resultsText = (
      <div>
        <p>{winText[rand(winLen)]}</p>
        <span onClick={props.restart} className="btn">
          Next Level
        </span>
      </div>
    );
  } else if (winner === false) {
    resultsText = (
      <div>
        <p>Maybe Next Time!</p>
        <span onClick={props.restart} className="btn">
          Try Again
        </span>
      </div>
    );
  } else if (winner === 'almost') {
    resultsText = (
      <div>
        <p>Mismatch!</p>
        <p>Make sure the last color you click matches the background.</p>
        <span onClick={props.restart} className="btn">
          Try Again
        </span>
      </div>
    );
  } else {
    classes = 'hidden';
  }

  return <div className={'winlose ' + classes}>{resultsText}</div>;
};
export default WinLose;
