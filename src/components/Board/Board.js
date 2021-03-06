import React, { Component } from 'react';
import Block from '../Block/Block.js';

import * as gamehelpers from '../../helpers/helpers.js';
import './Board.css';

export default class Board extends Component {
  componentDidMount() {
    let grid = this.loadGrid(
      this.props.numberofrows,
      this.props.numberofcolors,
      this.props.goalColor
    );
    this.renderBlocks(
      grid,
      this.props.numberofrows,
      this.props.colors,
      this.props.goalColor
    );
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.grid !== nextProps.grid) {
      this.renderBlocks(
        nextProps.grid,
        nextProps.numberofrows,
        nextProps.colors,
        nextProps.goalColor
      );
    }
  }

  loadGrid(rows, colors, goalColor) {
    let grid = gamehelpers.populateGrid(rows, colors, goalColor);
    this.props.createGrid(grid);
    return grid;
  }

  renderBlocks(grid, rows, colors, goalColor) {
    let blocks = [];
    // create the grid array
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < rows; j++) {
        // get the number from the current grid block
        let c = grid[i][j].color;
        let active = grid[i][j].active;

        // testing new impossible style
        let backgroundColor = colors[c]['background-color'];
        let borderColor = active ? 'white' : colors[c]['border-color'];

        // if (colors[c]['background-color'] === goalColor) {
        //   borderColor = colors[c]['border-color'];
        // }

        // assign a dom element to a slot in the box grid
        blocks.push(
          <Block
            key={'row' + i + 'col' + j}
            clickbox={(x, y) => this.clickbox(x, y)}
            xcoord={i}
            ycoord={j}
            cols={rows}
            bgcolor={backgroundColor}
            border={borderColor}
            //radius={borderRadius}
          />
        );
      }
    }

    this.props.loadBlocks(blocks);
  }

  clickbox(x, y) {
    // new array with 0,0 x,y coords
    let job = ['0 0'];

    // topcorner is the first number in the grid
    let topcorner = this.props.game.grid[0][0].color;

    // clickedColor is the number from div you clicked
    let clickedColor = this.props.game.grid[x][y].color;

    // if you clicked on the color that's already in the corner then return
    // no loss no gain
    if (topcorner === clickedColor) return;

    // otherwise increase clicks
    let clicks = this.props.game.clicks + 1;
    this.props.updateClicks(clicks);

    // and repaint the grid
    gamehelpers.setActive(
      job,
      topcorner,
      clickedColor,
      this.props,
      this.props.numberofrows,
      this.checkForWin
    );
  }

  checkForWin(_props) {
    var c = _props.grid[0][0].color,
      finalColor = _props.colors[c],
      goal = _props.colors[0];

    // if number of clicks is less than or equal to maxclick win will be set to true
    var win = _props.game.clicks <= _props.maxclick;

    // this checks to see if all of the boxes are the same color
    // as soon as it reachesa box that is a different color from the top left corner
    // it breaks out of the loop
    if (win) {
      for (var i = 0; i < _props.numberofrows; i++) {
        for (var j = 0; j < _props.numberofrows; j++) {
          if (_props.grid[i][j].color !== c) {
            win = false;
            break;
          }
        }
      }
    }

    if (win === true && finalColor !== goal) {
      win = 'almost';
    }

    // update redux state of hasWon
    if (win === true) {
      let upperLevel = _props.game.level + 1;
      _props.didWin(win);
      _props.updateLevel(upperLevel);
    } else if (win === 'almost') {
      _props.didWin(win);
    } else if (_props.game.clicks >= _props.maxclick - 1) {
      _props.didWin(false);
    }
  }

  render() {
    return (
      <div className={'gameBoard won-' + this.props.game.hasWon}>
        <div className="game">{this.props.game.blocks}</div>
      </div>
    );
  }
}
