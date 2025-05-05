import React, { Component } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert } from 'react-native';
import * as hueMoveHelpers from '../../helpers/hueMoveMode.js';

export default class HueMoveBoard extends Component {
  // Will store the indices of corner pieces
  topLeft = 0;
  topRight = 0;
  bottomLeft = 0;
  bottomRight = 0;
  
  // Will be initialized with the grid positions of corners
  corners = [];
  
  constructor(props = {}) {
    super(props);
    this.state = {
      selectedPiece: null,
      moves: 0,
      gameOver: false,
      showDebugInfo: false,
      boardSize: 0 // Will be set based on measurement
    };
  }
  
  componentDidMount() {
    this.initGame();
  }
  
  componentDidUpdate(prevProps) {
    // If level changes, reinitialize the game
    if (prevProps.level?.level !== this.props.level?.level) {
      this.initGame();
    }
  }
  
  initGame() {
    try {
      console.log('Initializing Hue Move game');
      
      // Get level configuration with fallback
      const level = this.props?.level || { gridSize: 6, colorModifier: 1, moveLimit: 25 };
      
      // Initialize corner positions based on the grid size
      const gridSize = level.gridSize || 6;
      
      // Set up corner indices (flat indices)
      this.topLeft = 0;
      this.topRight = gridSize - 1;
      this.bottomLeft = (gridSize * (gridSize - 1));
      this.bottomRight = (gridSize * gridSize) - 1;
      
      // Set up corner grid positions (2D coordinates)
      this.corners = [
        { row: 0, col: 0 },                // Top Left
        { row: 0, col: gridSize - 1 },     // Top Right
        { row: gridSize - 1, col: 0 },     // Bottom Left
        { row: gridSize - 1, col: gridSize - 1 }  // Bottom Right
      ];
      
      // Log corner positions for debugging
      console.log(`Corner positions initialized:
        topLeft: ${this.topLeft} = (0,0)
        topRight: ${this.topRight} = (0,${gridSize-1})
        bottomLeft: ${this.bottomLeft} = (${gridSize-1},0)
        bottomRight: ${this.bottomRight} = (${gridSize-1},${gridSize-1})
      `);
      
      console.log(`Grid size: ${gridSize}x${gridSize}`);
      console.log(`Corner positions: TL=${this.topLeft}, TR=${this.topRight}, BL=${this.bottomLeft}, BR=${this.bottomRight}`);
      
      // Create solved grid first
      const solvedGrid = hueMoveHelpers.generateSolvedHueMoveGrid(gridSize, level.colorModifier);
      
      // Then shuffle it for the initial game state
      const shuffledGrid = hueMoveHelpers.shuffleHueMoveGrid(solvedGrid);
      
      // Update the grid in Redux
      if (typeof this.props?.createGrid === 'function') {
        this.props.createGrid(shuffledGrid);
      }
      
      // Reset move counter
      this.setState({ moves: 0, selectedPiece: null });
      if (typeof this.props?.updateClicks === 'function') {
        this.props.updateClicks(0);
      }
      
      // Render the pieces
      this.renderBoard(shuffledGrid);
      
      console.log('Hue Move game initialized successfully');
    } catch (error) {
      console.error('Error initializing Hue Move game:', error);
    }
  }
  
  handleBoardLayout = (event) => {
    const { width } = event.nativeEvent.layout;
    this.setState({ boardSize: width });
  }
  
  handlePiecePress(index) {
    const { grid } = this.props.game || {};
    if (!grid) return;
    
    // Convert flat index to 2D grid coordinates
    const gridSize = Math.sqrt(grid.length || 0);
    const row = Math.floor(index / gridSize);
    const col = index % gridSize;
    
    console.log(`Piece pressed at index ${index} (row=${row}, col=${col})`);
    
    // Convert 2D coordinates to get the piece
    const piece = grid[row][col];
    
    // Check if this is a locked corner piece (using either isCorner flag or indices)
    if (
      piece.isCorner === true ||
      index === this.topLeft ||
      index === this.topRight ||
      index === this.bottomLeft ||
      index === this.bottomRight
    ) {
      console.log(`Corner piece at index ${index} (row=${row}, col=${col}) is locked`);
      return;
    }
    
    const { selectedPiece } = this.state;
    
    // If no piece is selected, select this one
    if (selectedPiece === null) {
      this.setState({ selectedPiece: index });
      return;
    }
    
    // If the same piece is selected, deselect it
    if (selectedPiece === index) {
      this.setState({ selectedPiece: null });
      return;
    }
    
    // Otherwise, swap the pieces
    this.swapPieces(selectedPiece, index);
    
    // Deselect after swap
    this.setState({ selectedPiece: null });
  }
  
  swapPieces(index1, index2) {
    const { grid } = this.props.game || {};
    if (!grid) return;
    
    // Convert flat indices to 2D coordinates
    const gridSize = Math.sqrt(grid.length || 0);
    const row1 = Math.floor(index1 / gridSize);
    const col1 = index1 % gridSize;
    const row2 = Math.floor(index2 / gridSize);
    const col2 = index2 % gridSize;
    
    // Create a deep copy of the grid
    const newGrid = JSON.parse(JSON.stringify(grid));
    
    // Get the pieces from the grid
    const piece1 = newGrid[row1][col1];
    const piece2 = newGrid[row2][col2];
    
    // Check if either piece is a locked corner (using either the isCorner flag or index)
    if (
      piece1.isCorner === true || piece2.isCorner === true ||
      index1 === this.topLeft || index1 === this.topRight || 
      index1 === this.bottomLeft || index1 === this.bottomRight ||
      index2 === this.topLeft || index2 === this.topRight || 
      index2 === this.bottomLeft || index2 === this.bottomRight
    ) {
      console.log("Cannot swap corner pieces");
      return;
    }
    
    console.log(`Swapping pieces: [${row1},${col1}] (${index1}) <-> [${row2},${col2}] (${index2})`);
    
    // Swap the pieces
    const temp = newGrid[row1][col1];
    newGrid[row1][col1] = newGrid[row2][col2];
    newGrid[row2][col2] = temp;
    
    // Update move counter
    const newMoves = this.state.moves + 1;
    this.setState({ moves: newMoves });
    
    // Update the moves counter in Redux
    if (typeof this.props?.updateClicks === 'function') {
      this.props.updateClicks(newMoves);
    }
    
    // Update the grid in Redux
    if (typeof this.props?.createGrid === 'function') {
      this.props.createGrid(newGrid);
    }
    
    // Re-render the board with the updated grid
    this.renderBoard(newGrid);
    
    // Debug: Verify corner positions are locked and dots are showing
    console.log(`Corners after swap:
      topLeft (${this.topLeft}): ${JSON.stringify(newGrid[0][0])}
      topRight (${this.topRight}): ${JSON.stringify(newGrid[0][Math.sqrt(newGrid.length)-1])}
      bottomLeft (${this.bottomLeft}): ${JSON.stringify(newGrid[Math.sqrt(newGrid.length)-1][0])}
      bottomRight (${this.bottomRight}): ${JSON.stringify(newGrid[Math.sqrt(newGrid.length)-1][Math.sqrt(newGrid.length)-1])}
    `);
    
    // Check if puzzle is solved
    if (this.checkPuzzleSolved(newGrid)) {
      this.handlePuzzleSolved();
    }
    
    // Check if we've reached the move limit
    const moveLimit = this.props.level?.moveLimit || 25;
    if (newMoves >= moveLimit) {
      this.handleGameOver(false);
    }
  }
  
  checkPuzzleSolved(grid) {
    if (!grid) return false;
    
    // Check if each piece is in its original position
    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[row].length; col++) {
        const piece = grid[row][col];
        if (piece.originalRow !== row || piece.originalCol !== col) {
          return false;
        }
      }
    }
    
    return true;
  }
  
  handlePuzzleSolved() {
    // Get level configuration
    const level = this.props.level || { level: 1, moveLimit: 25 };
    
    // Calculate score
    const score = hueMoveHelpers.calculateScore(
      this.state.moves,
      level.moveLimit,
      level.level
    );
    
    // Update score in Redux
    if (this.props.updateScore && this.props.game && this.props.game.score !== undefined) {
      this.props.updateScore(this.props.game.score + score);
    }
    
    // Mark game as won
    if (this.props.didWin) {
      this.props.didWin(true);
    }
    
    // Show congratulation message
    setTimeout(() => {
      Alert.alert(
        "Puzzle Solved!",
        `You completed the puzzle in ${this.state.moves} moves and earned ${score} points!`,
        [{ text: "Continue", style: "default" }]
      );
    }, 500);
  }
  
  handleGameOver(won) {
    this.setState({ gameOver: true });
    
    if (this.props.didWin) {
      this.props.didWin(won);
    }
    
    if (!won) {
      // Show game over message
      setTimeout(() => {
        Alert.alert(
          "Game Over",
          "You've run out of moves. Try again!",
          [{ text: "OK", style: "default" }]
        );
      }, 500);
    }
  }
  
  renderBoard(grid) {
    if (!grid || !Array.isArray(grid) || grid.length === 0) {
      console.warn('Invalid grid provided to renderBoard');
      return;
    }
    
    const gridSize = grid.length;
    const pieces = [];
    const { selectedPiece, boardSize } = this.state;
    
    // Calculate dimensions with a small gap between pieces
    const gap = 2; // Gap between pieces in pixels
    const totalGapsWidth = gap * (gridSize - 1);
    const pieceSize = boardSize > 0 ? (boardSize - totalGapsWidth) / gridSize : 0;
    
    // If we don't have a valid board size yet, don't render pieces
    if (pieceSize <= 0) {
      console.log('Board not measured yet, deferring piece rendering');
      return;
    }
    
    console.log(`Rendering board with grid size ${gridSize}x${gridSize}, piece size: ${pieceSize}, board size: ${boardSize}`);
    
    // Explicitly iterate through all grid positions
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        // Skip if grid position doesn't exist
        if (!grid[row] || !grid[row][col]) {
          console.warn(`Missing grid position at [${row},${col}]`);
          continue;
        }
        
        const index = row * gridSize + col;
        const piece = grid[row][col];
        
        // Calculate absolute position of this piece
        const xPos = col * (pieceSize + gap) + 2; // +2 for grid padding
        const yPos = row * (pieceSize + gap) + 2; // +2 for grid padding
        
        // Check corner positions - use both flag and exact coordinates
        const isCorner = 
          piece.isCorner === true || 
          (row === 0 && col === 0) ||
          (row === 0 && col === gridSize - 1) ||
          (row === gridSize - 1 && col === 0) ||
          (row === gridSize - 1 && col === gridSize - 1);
        
        // Debug logging for corners
        if (isCorner) {
          console.log(`Corner piece at position [${row},${col}], index=${index}, x=${xPos}, y=${yPos}`);
        }
        
        // Check if this piece is selected
        const isSelected = selectedPiece === index;
        
        pieces.push(
          <TouchableOpacity
            key={`piece-${index}`}
            style={[
              styles.piece,
              {
                backgroundColor: piece.color || '#cccccc',
                width: pieceSize,
                height: pieceSize,
                left: xPos,
                top: yPos,
                borderWidth: isSelected ? 2 : 0,
                borderColor: isSelected ? '#FFFFFF' : 'transparent'
              }
            ]}
            onPress={() => this.handlePiecePress(index)}
            activeOpacity={0.8}
          >
            {/* Draw corner dots for corner pieces */}
            {isCorner && (
              <View style={[styles.cornerDot, { 
                // Position dot in the center of the piece
                position: 'absolute',
                left: pieceSize / 2 - 5, // Half piece width minus half dot width
                top: pieceSize / 2 - 5,  // Half piece height minus half dot height
              }]} />
            )}
            
            {/* Debug info for development */}
            {this.state.showDebugInfo && (
              <Text style={styles.debugText}>
                {piece.originalRow},{piece.originalCol}
              </Text>
            )}
          </TouchableOpacity>
        );
      }
    }
    
    // Log the number of pieces generated
    console.log(`Generated ${pieces.length} pieces for a ${gridSize}x${gridSize} grid`);
    
    // Load the pieces into the Redux state
    if (typeof this.props?.loadBlocks === 'function') {
      this.props.loadBlocks(pieces);
    }
  }
  
  render() {
    const { game } = this.props || {};
    const { gameOver, moves } = this.state;
    const level = this.props.level || { level: 1, moveLimit: 25 };
    const blocks = game && game.blocks ? game.blocks : [];
    
    return (
      <View style={styles.boardContainer}>
        <View style={[
          styles.gameBoard,
          gameOver && styles.gameOver
        ]}>
          <View style={styles.movesContainer}>
            <Text style={styles.movesText}>
              Level {level.level} • Moves: {moves}/{level.moveLimit}
            </Text>
          </View>
          
          <View 
            style={styles.grid}
            onLayout={this.handleBoardLayout}
          >
            {blocks}
          </View>
          
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsText}>
              Tap a tile to select, then tap another to swap.
            </Text>
            
            <TouchableOpacity 
              style={styles.debugButton}
              onPress={() => this.setState(prev => ({ showDebugInfo: !prev.showDebugInfo }))}
            >
              <Text style={styles.debugButtonText}>
                {this.state.showDebugInfo ? "Hide Hints" : "Show Hints"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  boardContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    backgroundColor: 'transparent'
  },
  gameBoard: {
    width: '90%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent'
  },
  gameOver: {
    opacity: 0.7
  },
  movesContainer: {
    width: '100%',
    padding: 10,
    marginBottom: 5,
    alignItems: 'center'
  },
  movesText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white'
  },
  grid: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#444444',
    borderRadius: 8,
    overflow: 'hidden',
    padding: 2,
    marginVertical: 10,
    position: 'relative'
  },
  piece: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    margin: 0
  },
  cornerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#000000',
    borderWidth: 2,
    borderColor: 'white',
    position: 'absolute',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.8,
    shadowRadius: 1,
    elevation: 5,
    alignSelf: 'center'
  },
  instructionsContainer: {
    width: '100%',
    paddingVertical: 10,
    alignItems: 'center'
  },
  instructionsText: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9
  },
  debugText: {
    fontSize: 10,
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
    fontWeight: 'bold'
  },
  debugButton: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4
  },
  debugButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600'
  }
});