import React, { Component } from 'react';
import Block from '../Block/Block.js';

import * as gamehelpers from '../../helpers/helpers.js';
import './Board.css';

export default class Board extends Component {
  componentDidMount() {
    let grid = this.loadGrid(this.props.numberofrows, this.props.numberofcolors);
    this.renderBlocks(grid, this.props.numberofrows, this.props.goalColor);
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.grid !== nextProps.grid) {
      this.renderBlocks(nextProps.grid, nextProps.numberofrows, nextProps.goalColor);
    }
  }

  clickbox(x, y) {
    // new array with 0,0 x,y coords
    let job = [0, 0];

    // oldcolor is the first number in the grid
    let oldcolor = this.props.game.grid[0][0][0];

    // newcolor is the number from div you clicked
    let newcolor = this.props.game.grid[x][y][0];

    // if you clicked on the color that's already in the corner then return
    // no loss no gain
    if (oldcolor === newcolor) return;

    // otherwise increase clicks
    let clicks = this.props.game.clicks + 1;
    this.props.updateClicks(clicks);

    // and repaint the grid
    this.paint(job, oldcolor, newcolor);
  }

  loadGrid(rows, colors) {
    let grid = gamehelpers.populateGrid(rows, colors, 0);
    this.props.createGrid(grid);
    return grid;
  }

  renderBlocks(grid, rows, goalColor) {

    let blocks = [];

    // create the grid array
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < rows; j++) {

        // get the number from the current grid block                
        let c = grid[i][j][0];
        let active = grid[i][j][1];

        let backgroundColor = this.props.colors[c];

        // assign a dom element to a slot in the box grid
        blocks.push(<Block 
                key={"row"+i+"col"+j}
                clickbox={(x, y)=>this.clickbox(x,y)} 
                xcoord={i} 
                ycoord={j} 
                cols={rows}
                active={active}
                backgroundColor={backgroundColor} />);
      }
    }

    this.props.loadBlocks(blocks);
  }

  paint(job, oldcolor, newcolor) {
    let _this = this,
      newjob = [],
      grid = this.props.game.grid.slice(0);

    while (job.length > 1) {
      let y = job.pop();
      let x = job.pop();

      if (oldcolor !== grid[x][y][0]) continue;

      grid[x][y] = [newcolor, true];

      // check surrounding blocks to see what color they are 
      // and therefore if they should be updated
      if (x < (this.props.numberofrows - 1) && grid[x + 1][y][0] === oldcolor) {
        newjob.push(x + 1, y);
      }

      if (y < (this.props.numberofrows - 1) && grid[x][y + 1][0] === oldcolor) {
        newjob.push(x, y + 1);
      }

      if (x > 0 && grid[x - 1][y][0] === oldcolor) {
        newjob.push(x - 1, y);
      }

      if (y > 0 && grid[x][y - 1][0] === oldcolor) {
        newjob.push(x, y - 1);
      }
    }

    // update grid state
    this.props.createGrid(grid);

    if (newjob.length > 0) {
      setTimeout(function() {
        _this.paint(newjob, oldcolor, newcolor);
        _this.renderBlocks(grid, _this.props.numberofrows, _this.props.goalColor);
      }, 45);
    } else {
      // check if they've won
      _this.checkForWin();
    }
  }

  checkForWin() {
    var c = this.props.grid[0][0][0],
        finalColor = this.props.colors[c],
        goal = this.props.colors[0];

    // if number of clicks is less than or equal to maxclick win will be set to true
    var win = (this.props.game.clicks <= this.props.maxclick);

    // this checks to see if all of the boxes are the same color
    // as soon as it reachesa box that is a different color from the top left corner 
    // it breaks out of the loop
    if (win) {
      for (var i = 0; i < this.props.numberofrows; i++) {
        for (var j = 0; j < this.props.numberofrows; j++) {
          if (this.props.grid[i][j][0] !== c) {
            win = false;
            break;
          }
        }
      }
    }

    if ((win === true) && (finalColor !== goal)) {
      win = 'almost';
    }

    // update redux state of hasWon
    if (win) {
      let upperLevel = this.props.game.level + 1;
      this.props.didWin(win)
      this.props.updateLevel(upperLevel);
    } else if (this.props.game.clicks >= this.props.maxclick) {
      this.props.didWin(false);
    }
  }

  render() {
    return (
      <div className={"gameBoard won-" + this.props.game.hasWon}>
              <div className="game">
                {this.props.game.blocks}
              </div>
            </div>
    )
  }
}
