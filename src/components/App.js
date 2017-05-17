import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as gameActions from '../actions';

import { levels } from './Logic/levels.js';
import * as gamehelpers from './Logic/grid.js';

import Logo from './Logo/Logo.js';
import Board from './Board/Board.js';
import WinLose from './WinLose/WinLose.js';

import './App.css';

class App extends Component {
    restart(startover) {
        const { game } = this.props;
        let level = levels[game.level];

        if (startover) {
            level = levels[0];
            this.props.didWin(null, 0);
        } else {
            if (level) {
                this.props.didWin(null, game.level);
            } else {
                let setLevel = game.level - 1;
                level = levels[setLevel];
                this.props.didWin(null, setLevel);
            }
        }

        console.log(level);
        // reset game state
        this.props.updateClicks(0);

        let grid = gamehelpers.populateGrid(level.numberofrows, level.numberofcolors);

        this.props.createGrid(grid);
    }
    render() {
        const { game } = this.props;
        const level = levels[game.level];
        return (
            <div className="content">
            <div className="header">
              <h1>Color Flood <i className="triggerInfo">?</i></h1>
              <Logo />
              <div className="count">Moves Left: <span>{level.maxclick - game.clicks}</span></div>
            </div>            
            <Board
                grid={game.grid} 
                game={game} 
                updateClicks={this.props.updateClicks} 
                createGrid={this.props.createGrid}
                loadBlocks={this.props.loadBlocks}
                didWin={this.props.didWin}
                numberofrows={level.numberofrows}
                numberofcolors={level.numberofcolors}
                maxclick={level.maxclick}
                />
            <WinLose 
                won={game.hasWon}
                restart={(startover)=>this.restart(startover)}
                />
            <div className="header">
              <small className="instructions">Click the dots to change their colors. Your goal is to make them all match the background.</small>            
              <div className="newgame" onClick={(e) => this.restart()}>New Game</div>
            </div>
          </div>
        );
    }
}

function mapStateToProps(state) {
    return {
        game: state.gameReducer
    }
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        updateClicks: gameActions.updateClicks,
        createGrid: gameActions.createGrid,
        loadBlocks: gameActions.loadBlocks,
        didWin: gameActions.didWin
    }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(App);
