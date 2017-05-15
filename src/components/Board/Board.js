import React, { Component } from 'react';
import Block from '../Block/Block.js';
import { colors } from '../Logic/levels.js';
import './Board.css';

export default class Board extends Component {
    constructor(props) {
        super(props);
        this.state = {
            rowcount: 12,
        }
    }

    componentDidMount() {
        this.drawGrid();
    }

    rand(n) {
        return Math.floor(Math.random() * n);
    }

    clickbox(x, y) {
        // new array with 0,0 x,y coords
        var job = [0, 0];
        // oldcolor is the first number in the grid
        var oldcolor = this.props.game.grid[0][0];
        // newcolor is the number from div you clicked
        var newcolor = this.props.game.grid[x][y];
        // if you clicked on the color that's already in the corner then return
        // no loss no gain
        if (oldcolor === newcolor) return;

        // otherwise increase clicks
        this.props.updateClicks(1);

        // and repaint the grid
        this.paint(job, oldcolor, newcolor);
    }

    drawGrid() {
        let grid = [];
        let blocks = [];
        // create the grid array
        for (var i = 0; i < this.props.numberofrows; i++) {
            // make a new array for each row of the grid
            grid[i] = [];
            blocks[i] = [];

            for (var j = 0; j < this.props.numberofrows; j++) {

                // get a random number between 0 and the # of available colors
                let c = this.rand(this.props.numberofcolors);
                let backgroundColor = colors[c];

                // assigned that number to a slot in the grid
                grid[i][j] = c;

                // assign a dom element to a slot in the box grid
                blocks[i][j] = <Block 
                                key={"row"+i+"col"+j}
                                clickbox={(x, y)=>this.clickbox(x,y)} 
                                xcoord={i} 
                                ycoord={j} 
                                cols={this.props.numberofrows}
                                backgroundColor={backgroundColor} />;
            }
        }

        console.log(blocks);

        this.props.createGrid(grid, blocks);
    }

    paint(job, oldcolor, newcolor) {
        let _this = this,
            newjob = [],
            grid = this.props.game.grid.slice(0),
            blocks = this.props.game.blocks.slice(0);

        while (job.length > 1) {
            var y = job.pop();
            var x = job.pop();

            if (oldcolor !== grid[x][y]) continue;

            grid[x][y] = newcolor;
            
            console.log(blocks[x]);
            blocks[x].splice(y, 1, <Block key={"row"+x+"col"+y}
                                clickbox={(x, y)=>this.clickbox(x,y)} 
                                xcoord={x} 
                                ycoord={y} 
                                cols={this.props.numberofrows}
                                backgroundColor={colors[newcolor]} />);
            console.log(blocks[x]);

            if (x < (this.props.numberofrows - 1) && grid[x + 1][y] === oldcolor) {
                newjob.push([x + 1, y]);
            }

            if (y < (this.props.numberofrows - 1) && grid[x][y + 1] === oldcolor) {
                newjob.push([x, y + 1]);
            }

            if (x > 0 && grid[x - 1][y] === oldcolor) {
                newjob.push([x - 1, y]);
            }

            if (y > 0 && grid[x][y - 1] === oldcolor) {
                newjob.push([x, y - 1]);
            }
        }

        this.props.createGrid(grid, blocks);

        if (newjob.length > 0) {
            setTimeout(function() {
                _this.paint(newjob, oldcolor, newcolor);
            }, 30);
        }
        // else {
        //     showinfo();
        // }
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
