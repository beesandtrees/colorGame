import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { winText } from '../../helpers/constants.js';
import { rand } from '../../helpers/helpers.js';

const WinLose = props => {
  let winner = props.won;
  let winLen = winText.length;
  let resultsText;

  if (winner === true) {
    const score = props.game && props.game.score ? props.game.score : 0;
    const level = props.game && props.game.level ? props.game.level : 1;
    const nextLevel = level + 1;
    
    // Calculate the next level multiplier for display
    const nextLevelMultiplier = Math.pow(1.2, level).toFixed(1);
    
    resultsText = (
      <View>
        <Text style={styles.titleText}>{winText[rand(winLen)]}</Text>
        <Text style={styles.text}>Level {level} Complete!</Text>
        <Text style={styles.scoreText}>Score: {score}</Text>
        <Text style={styles.text}>Next level: {nextLevel}</Text>
        <Text style={styles.bonusText}>Score multiplier: {nextLevelMultiplier}x</Text>
        <TouchableOpacity 
          onPress={() => {
            // Reset win state first
            if (props.didWin) {
              props.didWin(null);
            }
            // Move to the next level
            const nextLevel = level + 1;
            // Reset match count
            if (props.updateMatchesMade) {
              props.updateMatchesMade(0);
            }
            // Update level
            if (props.updateLevel) {
              props.updateLevel(nextLevel);
            }
            // Restart game (false means don't start over from level 1)
            if (props.restart) {
              props.restart(false);
            }
          }} 
          style={styles.btn}
        >
          <Text style={styles.btnText}>Next Level</Text>
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