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

class Info extends Component {
  render() {
    let info = (<div className="triggerInfo"><span>?</span></div>);

    if (this.props.show === true) {
      info = (<div className="triggerInfo triggered">
                    <small className="instructions"><span>?</span>Click the dots to change their colors. Your goal is to make them all match the page background.</small>
                </div>);
    }
    return info;
  }
}

class App extends Component {
  constructor(props) {
    super(props);
    let shuffleColors = gamehelpers.fisherYates(colors);
    this.state = {
      showInfo: false,
      colors: shuffleColors,
      level: gamehelpers.createLevel(this.props.game.level)
    };
  }
  restart(startover) {
    const { game } = this.props;
    let shuffleColors = gamehelpers.fisherYates(colors);
    let level = gamehelpers.createLevel(game.level);

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

    let grid = gamehelpers.populateGrid(level.numberofrows, level.numberofcolors, 0);

    this.props.createGrid(grid);
  }
  showInfo() {
    this.setState({ showInfo: !this.state.showInfo });
  }
  render() {
    const { game } = this.props;
    const level = this.state.level;
    let baseColor = this.state.colors[0];
    return (
      <div className={"content " + baseColor}>
            <div className="header">
              <Logo />
              <div className="h1">Color Flood 
                <div onClick={()=>this.showInfo()}>
                    <Info show={this.state.showInfo} />
                </div>
              </div>
              <div className="count">Moves Left: <span>{level.maxclick - game.clicks}</span></div>
            </div>            
            <Board
                colors={this.state.colors}
                goalColor={baseColor}
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
