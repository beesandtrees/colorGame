import React, { Component } from 'react';
import Block from '../Block/Block.js';
import { colors } from '../Logic/levels.js';
import './Board.css';

export default class Board extends Component {
    // constructor(props) {
    //     super(props);
    //     this.state = {
    //         blocks: [],
    //         rowcount: 12,
    //     }
    // }

    componentDidMount() {
        let grid = this.populateGrid();
        this.renderBlocks(grid);
    }

    rand(n) {
        return Math.floor(Math.random() * n);
    }

    clickbox(x, y) {
        // new array with 0,0 x,y coords
        let job = [0, 0];

        // oldcolor is the first number in the grid
        let oldcolor = this.props.game.grid[0][0];

        // newcolor is the number from div you clicked
        let newcolor = this.props.game.grid[x][y];

        // if you clicked on the color that's already in the corner then return
        // no loss no gain
        if (oldcolor === newcolor) return;

        // otherwise increase clicks
        let clicks = parseInt(this.props.game.clicks + 1);
        this.props.updateClicks(clicks);

        // and repaint the grid
        this.paint(job, oldcolor, newcolor);
    }

    populateGrid() {
        let grid = [];

        // create the grid array
        for (let i = 0; i < this.props.numberofrows; i++) {

            // make a new array for each row of the grid
            grid[i] = [];
            for (let j = 0; j < this.props.numberofrows; j++) {

                // get a random number between 0 and the # of available colors
                let c = this.rand(this.props.numberofcolors);

                // assigned that number to a slot in the grid
                grid[i][j] = c;
            }
        }

        this.props.createGrid(grid);

        return grid;
    }

    renderBlocks(grid) {
        let blocks = [];
        // create the grid array
        for (let i = 0; i < this.props.numberofrows; i++) {
            for (let j = 0; j < this.props.numberofrows; j++) {

                // get a random number between 0 and the # of available colors
                let c = grid[i][j];
                let backgroundColor = colors[c];

                // assign a dom element to a slot in the box grid
                blocks.push(<Block 
                    key={"row"+i+"col"+j}
                    clickbox={(x, y)=>this.clickbox(x,y)} 
                    xcoord={i} 
                    ycoord={j} 
                    cols={this.props.numberofrows}
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

            if (oldcolor !== grid[x][y]) continue;

            grid[x][y] = newcolor;

            // check surrounding blocks to see what color they are 
            // and therefore if they should be updated
            if (x < (this.props.numberofrows - 1) && grid[x + 1][y] === oldcolor) {
                newjob.push(x + 1, y);
            }

            if (y < (this.props.numberofrows - 1) && grid[x][y + 1] === oldcolor) {
                newjob.push(x, y + 1);
            }

            if (x > 0 && grid[x - 1][y] === oldcolor) {
                newjob.push(x - 1, y);
            }

            if (y > 0 && grid[x][y - 1] === oldcolor) {
                newjob.push(x, y - 1);
            }
        }

        // update grid state
        this.props.createGrid(grid, null);

        if (newjob.length > 0) {
            setTimeout(function() {
                _this.paint(newjob, oldcolor, newcolor);
                _this.renderBlocks(grid);            
            }, 45);
        } else {
            // check if they've won
        }
    }

    render() {
        return (
            <div className="gameBoard">
              <div className="game">
                {this.props.game.blocks}
              </div>
            </div>
        )
    }
}
