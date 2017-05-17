import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as gameActions from '../actions';

import { colors } from '../helpers/constants.js';
import * as gamehelpers from '../helpers/helpers.js';

import Logo from './Logo/Logo.js';
import Board from './Board/Board.js';
import WinLose from './WinLose/WinLose.js';

import './App.css';

class App extends Component {
    constructor(props) {
        super(props);
        let shuffleColors = gamehelpers.fisherYates(colors);
        this.state = {
            colors: shuffleColors,
            level: gamehelpers.createLevel(this.props.game.level)
        };
    }
    restart(startover) {
        const { game } = this.props;
        let shuffleColors = gamehelpers.fisherYates(colors);
        let level = gamehelpers.createLevel(game.level);

        console.log(level);

        // reset game state
        this.props.updateClicks(0);

        if (startover === true) {
            level = gamehelpers.createLevel(0);
            this.props.didWin(null);
            this.props.updateLevel(0);
        } else {
            this.props.didWin(null);
        }

        this.setState = ({
            colors: shuffleColors,
            level: level
        });

        let grid = gamehelpers.populateGrid(level.numberofrows, level.numberofcolors);

        this.props.createGrid(grid);
    }
    render() {
        const { game } = this.props;
        const level = this.state.level;
        let baseColor = this.state.colors[0];
        return (
            <div className={"content " + baseColor}>
            <div className="header">
              <Logo />
              <h1>Color Flood <i className="triggerInfo">?</i></h1>
              <div className="count">Moves Left: <span>{level.maxclick - game.clicks}</span></div>
            </div>            
            <Board
                colors={this.state.colors}
                grid={game.grid} 
                game={game} 
                updateClicks={this.props.updateClicks} 
                updateLevel={this.props.updateLevel}
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
              <div className="newgame" onClick={(e) => this.restart(true)}>New Game</div>
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
        didWin: gameActions.didWin,
        updateLevel: gameActions.updateLevel
    }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(App);
