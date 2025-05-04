import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import GameBoard from './components/GameBoard';

const Match3Prototype = () => {
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  
  // Available color schemes
  const colorSchemes = [
    [
      { backgroundColor: '#5cb85c', borderColor: '#4cae4c' }, // Green
      { backgroundColor: '#5bc0de', borderColor: '#46b8da' }, // Blue
      { backgroundColor: '#f0ad4e', borderColor: '#eea236' }, // Yellow
      { backgroundColor: '#d9534f', borderColor: '#d43f3a' }, // Red
      { backgroundColor: '#9370DB', borderColor: '#8A2BE2' }, // Purple
      { backgroundColor: '#337ab7', borderColor: '#2e6da4' }, // Dark Blue
    ],
    [
      { backgroundColor: '#FF6384', borderColor: '#FF2D55' }, // Pink
      { backgroundColor: '#36A2EB', borderColor: '#007AFF' }, // Blue
      { backgroundColor: '#FFCE56', borderColor: '#FFCC00' }, // Yellow
      { backgroundColor: '#4BC0C0', borderColor: '#5AC8FA' }, // Teal
      { backgroundColor: '#9966FF', borderColor: '#5856D6' }, // Purple
      { backgroundColor: '#FF9F40', borderColor: '#FF9500' }, // Orange
    ],
  ];
  
  const [currentColorScheme, setCurrentColorScheme] = useState(0);
  
  // Handle score updates
  const handleScoreUpdate = (newScore) => {
    setScore(newScore);
    
    // Example win condition: score >= 1000
    if (newScore >= 1000 && !isGameOver) {
      setIsGameOver(true);
    }
  };
  
  // New game - completely restart the game board
  const startNewGame = () => {
    // Reset game state
    setScore(0);
    setIsGameOver(false);
    
    // Cycle through color schemes
    setCurrentColorScheme((currentColorScheme + 1) % colorSchemes.length);
    
    // Force GameBoard to re-render with a new key
    // This effectively creates a completely new board component
    setGameBoardKey(Date.now());
  };
  
  // Use a key to force full re-rendering of the game board
  const [gameBoardKey, setGameBoardKey] = useState(Date.now());
  
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Color Match 3</Text>
      
      <GameBoard 
        key={gameBoardKey}
        rows={8}
        colors={colorSchemes[currentColorScheme]}
        onScoreUpdate={handleScoreUpdate}
      />
      
      {isGameOver && (
        <View style={styles.gameOverContainer}>
          <Text style={styles.gameOverText}>Level Complete!</Text>
          <Text style={styles.finalScoreText}>Final Score: {score}</Text>
          <TouchableOpacity style={styles.newGameButton} onPress={startNewGame}>
            <Text style={styles.newGameButtonText}>New Game</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {!isGameOver && (
        <TouchableOpacity style={styles.newGameButton} onPress={startNewGame}>
          <Text style={styles.newGameButtonText}>New Game</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingVertical: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  gameOverContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  gameOverText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4cae4c',
  },
  finalScoreText: {
    fontSize: 20,
    marginVertical: 10,
  },
  newGameButton: {
    backgroundColor: '#5cb85c',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    marginTop: 20,
  },
  newGameButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Match3Prototype;