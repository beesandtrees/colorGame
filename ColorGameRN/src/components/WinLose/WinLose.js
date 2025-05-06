import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { winText } from '../../helpers/constants.js';
import { rand } from '../../helpers/helpers.js';

// Import Hue Move helpers using try-catch to handle potential module loading issues
let hueMoveHelpers = {};
try {
  hueMoveHelpers = require('../../helpers/hueMoveMode.js');
} catch (error) {
  console.error('Error importing hueMoveMode.js:', error);
}

const WinLose = props => {
  let winner = props.won;
  let winLen = winText.length;
  let resultsText;

  if (winner === true) {
    const score = props.game && props.game.score ? props.game.score : 0;
    const level = props.game && props.game.level ? props.game.level : 1;
    const nextLevel = level + 1;
    const gameMode = props.game && props.game.gameMode ? props.game.gameMode : 'classic';
    
    // Calculate the next level multiplier for display
    const nextLevelMultiplier = Math.pow(1.2, level).toFixed(1);
    
    // Check if this is the last level in a round (only applies to Hue Move mode)
    const isHueMoveMode = gameMode === 'huemove';
    let isLastLevelInRound = false;
    
    // Add a try-catch to handle potential errors with the helper functions
    try {
      if (isHueMoveMode && typeof hueMoveHelpers.isLastLevelInRound === 'function') {
        isLastLevelInRound = hueMoveHelpers.isLastLevelInRound(level);
      }
    } catch (error) {
      console.error('Error checking if level is last in round:', error);
    }
    
    // If it's Hue Move mode, get grid size and current round info
    let roundInfo = '';
    if (isHueMoveMode) {
      try {
        // Ensure all required functions exist
        if (typeof hueMoveHelpers.createHueLevel === 'function' && 
            typeof hueMoveHelpers.calculateTotalLevelsInRound === 'function') {
          
          const levelConfig = hueMoveHelpers.createHueLevel(level);
          const gridSize = levelConfig.gridSize;
          const totalLevelsInRound = hueMoveHelpers.calculateTotalLevelsInRound(gridSize);
          
          // Find the first level for this grid size
          let firstLevelForGridSize;
          if (gridSize === 5) firstLevelForGridSize = 1;
          else if (gridSize === 6) firstLevelForGridSize = 4;
          else if (gridSize === 7) firstLevelForGridSize = 8;
          else if (gridSize === 8) firstLevelForGridSize = 13;
          else firstLevelForGridSize = 19;
          
          // Calculate which level within the round this is
          const levelInRound = level - firstLevelForGridSize + 1;
          
          if (isLastLevelInRound) {
            roundInfo = `Round complete! (${levelInRound}/${totalLevelsInRound})`;
          } else {
            roundInfo = `Round progress: ${levelInRound}/${totalLevelsInRound}`;
          }
        }
      } catch (error) {
        console.error('Error calculating round info:', error);
        roundInfo = `Level ${level}`;
      }
    }
    
    resultsText = (
      <View>
        <Text style={styles.titleText}>{winText[rand(winLen)]}</Text>
        <Text style={styles.text}>Level {level} Complete!</Text>
        {isHueMoveMode && <Text style={styles.roundText}>{roundInfo}</Text>}
        <Text style={styles.scoreText}>Score: {score}</Text>
        <Text style={styles.text}>Next level: {nextLevel}</Text>
        <Text style={styles.bonusText}>Score multiplier: {nextLevelMultiplier}x</Text>
        <TouchableOpacity 
          onPress={() => {
            // Move to the next level
            const nextLevel = level + 1;
            console.log(`WinLose: Moving from level ${level} to level ${nextLevel}`);
            
            // Update level in Redux first - this is crucial!
            if (props.updateLevel) {
              props.updateLevel(nextLevel);
            }
            
            // Reset match count if applicable
            if (props.updateMatchesMade) {
              props.updateMatchesMade(0);
            }
            
            // Reset win state - do this after level update
            if (props.didWin) {
              props.didWin(null);
            }
            
            // Restart game with continuation flag (false means don't reset to level 1)
            if (props.restart) {
              // Add slight delay to ensure level update is processed
              setTimeout(() => {
                props.restart(false);
              }, 100);
            }
          }} 
          style={styles.btn}
        >
          <Text style={styles.btnText}>
            {isHueMoveMode && isLastLevelInRound ? 'Next Round' : 'Next Level'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  } else if (winner === false) {
    resultsText = (
      <View>
        <Text style={styles.text}>Maybe Next Time!</Text>
        <TouchableOpacity onPress={props.restart} style={styles.btn}>
          <Text style={styles.btnText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  } else if (winner === 'almost') {
    resultsText = (
      <View>
        <Text style={styles.text}>Mismatch!</Text>
        <Text style={styles.text}>Make sure the last color you click matches the background.</Text>
        <TouchableOpacity onPress={props.restart} style={styles.btn}>
          <Text style={styles.btnText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (winner === null) {
    return null;
  }

  return (
    <View style={styles.winlose}>
      {resultsText}
    </View>
  );
};

const styles = StyleSheet.create({
  winlose: {
    position: 'absolute',
    width: '80%',
    alignSelf: 'center',
    top: '40%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 10,
  },
  titleText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#0066cc',
  },
  text: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 10,
  },
  scoreText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#FF6B00',
  },
  roundText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#F91593',
  },
  bonusText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    color: '#4CAF50',
  },
  btn: {
    backgroundColor: '#0066cc',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 10,
  },
  btnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default WinLose;