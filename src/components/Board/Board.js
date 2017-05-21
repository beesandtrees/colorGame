import React, { Component } from 'react';
import Block from '../Block/Block.js';

import * as gamehelpers from '../../helpers/helpers.js';
import './Board.css';

export default class Board extends Component {
    componentDidMount() {
        let grid = this.loadGrid(this.props.numberofrows, this.props.numberofcolors);
        this.renderBlocks(grid, this.props.numberofrows, this.props.goalColor, this.props.colors);
    }

    componentWillReceiveProps(nextProps) {
        if (this.props.grid !== nextProps.grid) {
            this.renderBlocks(nextProps.grid, nextProps.numberofrows, nextProps.goalColor, nextProps.colors);
        }
    }

    loadGrid(rows, colors) {
        let grid = gamehelpers.populateGrid(rows, colors, 0);
        this.props.createGrid(grid);
        return grid;
    }

    renderBlocks(grid, rows, goalColor, colors) {

        let blocks = [];

        // create the grid array
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < rows; j++) {

                // get the number from the current grid block                
                let c = grid[i][j][0];
                let active = grid[i][j][1];

                let backgroundColor = colors[c]["background-color"];
                let border = active ? "white" : colors[c]["border-color"];

                // assign a dom element to a slot in the box grid
                blocks.push(<Block 
                key={"row"+i+"col"+j}
                clickbox={(x, y)=>this.clickbox(x,y)} 
                xcoord={i} 
                ycoord={j} 
                cols={rows}
                bgcolor={backgroundColor}
                border={border} />);
            }
        }

        this.props.loadBlocks(blocks);
    }

    clickbox(x, y) {
        // new array with 0,0 x,y coords
        let job = ["00"];

        // topcorner is the first number in the grid
        let topcorner = this.props.game.grid[0][0][0];

        // clickedColor is the number from div you clicked
        let clickedColor = this.props.game.grid[x][y][0];

        // if you clicked on the color that's already in the corner then return
        // no loss no gain
        if (topcorner === clickedColor) return;

        // otherwise increase clicks
        let clicks = this.props.game.clicks + 1;
        this.props.updateClicks(clicks);

        // and repaint the grid
        this.paint(job, topcorner, clickedColor);
    }

    paint(job, topcorner, clickedColor) {
        let _this = this,
            _props = this.props,
            numrows = this.props.numberofrows,
            newjob = [],
            grid = _props.game.grid.slice(0),
            loops = job.length;


        for (var x = 0; x < loops; x++) {

            let rowCol = job.shift();
            let row = parseInt(rowCol.substring(0, 1));
            let col = parseInt(rowCol.substring(1, 2));


            if (grid[row][col][0] === clickedColor || grid[row][col][0] === topcorner) {

                grid[row][col] = [clickedColor, true];

                let bottom = row < (numrows - 1) ? grid[row + 1][col] : [];
                let right = col < (numrows - 1) ? grid[row][col + 1] : [];
                let top = row > 0 ? grid[row - 1][col] : [];
                let left = col > 0 ? grid[row][col - 1] : [];

                if (row < (numrows - 1)) {
                    if ((bottom[0] === topcorner && bottom[1] === true) ||
                        (bottom[0] === clickedColor && bottom[1] === false)) {
                        if (newjob.indexOf((row + 1) + "" + col) === -1) {
                            newjob.push((row + 1) + "" + col);
                        }
                    }
                }

                if (col < (numrows - 1)) {
                    if ((right[0] === topcorner && right[1] === true) ||
                        (right[0] === clickedColor && right[1] === false)) {
                        if (newjob.indexOf(row + "" + (col + 1)) === -1) {
                            newjob.push(row + "" + (col + 1));
                        }
                    }
                }

                if (row > 0) {
                    if ((top[0] === topcorner && top[1] === true) ||
                        (top[0] === clickedColor && top[1] === false)) {
                        if (newjob.indexOf((row - 1) + "" + col) === -1) {
                            newjob.push((row - 1) + "" + col);
                        }
                    }
                }

                if (col > 0) {
                    if ((left[0] === topcorner && left[1] === true) ||
                        (left[0] === clickedColor && left[1] === false)) {
                        if (newjob.indexOf(row + "" + (col - 1)) === -1) {
                            newjob.push(row + "" + (col - 1));
                        }
                    }
                }
            }
        }

        // update grid state
        _props.createGrid(grid);

        if (newjob.length > 0) {
            setTimeout(function() {
                _this.paint(newjob, topcorner, clickedColor);
                _this.renderBlocks(grid, _props.numberofrows, _props.goalColor, _props.colors);
            }, 30);
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
        if (win === true) {
            let upperLevel = this.props.game.level + 1;
            this.props.didWin(win)
            this.props.updateLevel(upperLevel);
        } else if (win === 'almost') {
            this.props.didWin(win)
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
