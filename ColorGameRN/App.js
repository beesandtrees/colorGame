import React, { Component } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Modal } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Provider, connect } from 'react-redux';
import { createStore } from 'redux';
import { bindActionCreators } from 'redux';

import rootReducer from './src/reducers';
import * as gameActions from './src/actions';
import { colorArrays } from './src/helpers/constants.js';
import * as gamehelpers from './src/helpers/helpers.js';
import * as puzzleHelpers from './src/helpers/puzzleMode.js';

import Logo from './src/components/Logo/Logo.js';
import Board from './src/components/Board/Board.js';
import PuzzleBoard from './src/components/Board/PuzzleBoard.js';
import WinLose from './src/components/WinLose/WinLose.js';
import ModeSelect from './src/components/ModeSelect/ModeSelect.js';

const store = createStore(rootReducer);

class Info extends Component {
  render() {
    const { gameMode } = this.props;
    
    let instructions = "";
    if (gameMode === 'classic') {
      instructions = "Click the dots to change their colors. Your goal is to make them all match the page background.";
    } else if (gameMode === 'puzzle') {
      instructions = 
        "Puzzle Mode is a Match-3 style game:\n\n" +
        "• TAP a block to select it\n" +
        "• TAP an adjacent block to swap them\n" +
        "• MATCH 3 or more blocks of the same color\n" + 
        "• EARN points for each match you make\n\n" +
        "You have a limited number of moves - make them count!";
    }
    
    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={this.props.show}
        onRequestClose={() => this.props.onClose(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalView}>
            <Text style={styles.instructions}>
              {instructions}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => this.props.onClose(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }
}

class AppContent extends Component {
  constructor(props) {
    super(props);
    let gameLevel = Math.ceil((this.props.game.level + 1) / 8) % 5;
    let shuffleColors = gamehelpers.fisherYates(colorArrays[gameLevel]);
    
    this.state = {
      showInfo: false,
      showModeSelect: false,
      colors: shuffleColors,
      level: this.getLevel(this.props.game.level, this.props.game.gameMode)
    };
  }
  
  getLevel(levelNumber, gameMode) {
    if (gameMode === 'classic') {
      return gamehelpers.createLevel(levelNumber);
    } else if (gameMode === 'puzzle') {
      return puzzleHelpers.createPuzzleLevel(levelNumber);
    }
    // Default to classic mode if unknown
    return gamehelpers.createLevel(levelNumber);
  }
  
  restart(startover) {
    const { game } = this.props;
    let gameLevel = Math.ceil((game.level + 1) / 8) % 5;
    let shuffleColors = gamehelpers.fisherYates(colorArrays[gameLevel]);
    let level = this.getLevel(game.level, game.gameMode);

    // reset game state (except score for cumulative scoring)
    this.props.updateClicks(0);
    this.props.updateMatchesMade(0);
    
    // Only reset score if starting over completely
    if (startover === true) {
      this.props.updateScore(0);
    }

    if (startover === true) {
      level = this.getLevel(0, game.gameMode);
      this.props.didWin(null);
      this.props.updateLevel(0);
    } else {
      this.props.didWin(null);
    }

    this.setState({
      colors: shuffleColors,
      level: level
    });

    // Generate grid based on game mode
    let grid;
    if (game.gameMode === 'classic') {
      grid = gamehelpers.populateGrid(
        level.numberofrows,
        level.numberofcolors
      );
    } else if (game.gameMode === 'puzzle') {
      grid = puzzleHelpers.generatePuzzleGrid(
        level.numberofrows,
        level.numberofcolors
      );
    }

    this.props.createGrid(grid);
  }
  
  showInfo(tf) {
    this.setState({ showInfo: tf });
  }
  
  showModeSelect(tf) {
    this.setState({ showModeSelect: tf });
  }
  
  handleModeSelect(mode) {
    // Set game mode in redux
    this.props.setGameMode(mode);
    
    // Close modal
    this.setState({ showModeSelect: false });
    
    // Reset game with new mode
    this.props.updateLevel(1);
    this.props.didWin(null);
    
    // We'll restart the game with the new mode
    setTimeout(() => {
      this.restart(true);
    }, 100);
  }
  
  renderHeader() {
    const { game } = this.props;
    const level = this.state.level;
    
    if (game.gameMode === 'classic') {
      return (
        <View style={styles.header}>
          <Logo />
          <Text style={styles.title}>Color Flood</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => this.showModeSelect(true)}
            >
              <Text style={styles.headerButtonText}>Switch Mode</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.infoButton}
              onPress={() => this.showInfo(true)}
            >
              <Text style={styles.infoButtonText}>?</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.count}>
            Moves Left: <Text style={styles.countNumber}>{level.maxclick - game.clicks}</Text>
          </Text>
        </View>
      );
    } else if (game.gameMode === 'puzzle') {
      return (
        <View style={styles.header}>
          <Logo />
          <Text style={styles.title}>Color Puzzle</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => this.showModeSelect(true)}
            >
              <Text style={styles.headerButtonText}>Switch Mode</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.infoButton}
              onPress={() => this.showInfo(true)}
            >
              <Text style={styles.infoButtonText}>?</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.statsContainer}>
            <Text style={styles.count}>
              Score: <Text style={styles.countNumber}>{game.score}</Text>
            </Text>
            <Text style={styles.count}>
              Matches: <Text style={styles.countNumber}>{game.matchesMade}/{level.matchGoal}</Text>
            </Text>
            <Text style={styles.count}>
              Moves: <Text style={styles.countNumber}>{level.moveLimit - game.clicks}</Text>
            </Text>
          </View>
          <Text style={styles.goalText}>
            Level {level.level}: Make <Text style={styles.goalNumber}>{level.matchGoal}</Text> matches
          </Text>
        </View>
      );
    }
  }
  
  renderBoard() {
    const { game } = this.props;
    const level = this.state.level;
    const baseColor = this.state.colors[0].backgroundColor;
    
    if (game.gameMode === 'classic') {
      return (
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
      );
    } else if (game.gameMode === 'puzzle') {
      return (
        <PuzzleBoard
          colors={this.state.colors}
          grid={game.grid}
          game={game}
          updateClicks={this.props.updateClicks}
          updateScore={this.props.updateScore}
          updateLevel={this.props.updateLevel}
          createGrid={this.props.createGrid}
          loadBlocks={this.props.loadBlocks}
          didWin={this.props.didWin}
          updateMatchesMade={this.props.updateMatchesMade}
          numberofrows={level.numberofrows}
          numberofcolors={level.numberofcolors}
          level={level}
          restart={(startover) => this.restart(startover)}
        />
      );
    }
  }
  
  renderFooter() {
    return (
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.newGameButton}
          onPress={() => this.restart(true)}
        >
          <Text style={styles.newGameButtonText}>New Game</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  render() {
    const { game } = this.props;
    const baseColor = this.state.colors[0].backgroundColor;
    
    return (
      <SafeAreaView 
        style={[
          styles.container, 
          { backgroundColor: baseColor }
        ]}
      >
        <StatusBar style="light" />
        
        {this.renderHeader()}
        {this.renderBoard()}
        
        <WinLose
          won={game.hasWon}
          restart={startover => this.restart(startover)}
          game={game}
          updateLevel={this.props.updateLevel}
          updateMatchesMade={this.props.updateMatchesMade}
          didWin={this.props.didWin}
        />
        
        {this.renderFooter()}
        
        <Info 
          show={this.state.showInfo} 
          onClose={(tf) => this.showInfo(tf)}
          gameMode={game.gameMode}
        />
        
        <ModeSelect
          visible={this.state.showModeSelect}
          onSelect={(mode) => this.handleModeSelect(mode)}
          onClose={() => this.showModeSelect(false)}
        />
      </SafeAreaView>
    );
  }
}

function mapStateToProps(state) {
  return {
    game: state.gameReducer
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      updateClicks: gameActions.updateClicks,
      createGrid: gameActions.createGrid,
      loadBlocks: gameActions.loadBlocks,
      didWin: gameActions.didWin,
      updateLevel: gameActions.updateLevel,
      setGameMode: gameActions.setGameMode,
      updateScore: gameActions.updateScore,
      updateMatchesMade: gameActions.updateMatchesMade
    },
    dispatch
  );
}

const App = connect(
  mapStateToProps,
  mapDispatchToProps
)(AppContent);

export default function() {
  return (
    <Provider store={store}>
      <App />
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingTop: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  headerButtons: {
    position: 'absolute',
    flexDirection: 'row',
    right: 30,
    top: 20,
  },
  headerButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 10,
  },
  headerButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  infoButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  count: {
    fontSize: 20,
    color: 'white',
    marginTop: 10,
    marginBottom: 30,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
    marginBottom: 30,
  },
  countNumber: {
    fontWeight: 'bold',
  },
  goalText: {
    fontSize: 18,
    color: 'white',
    marginTop: 0,
    marginBottom: 15,
    textAlign: 'center',
  },
  goalNumber: {
    fontWeight: 'bold',
    fontSize: 20,
  },
  footer: {
    padding: 30,
    alignItems: 'center',
  },
  newGameButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  newGameButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalView: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  instructions: {
    fontSize: 16,
    textAlign: 'left',
    marginBottom: 15,
    lineHeight: 22,
  },
  closeButton: {
    backgroundColor: '#0066cc',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 10,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});