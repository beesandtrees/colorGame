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
      boardSize: 0, // Will be set based on measurement
      showingSolution: true, // Start by showing the solution
      gameStarted: false // Game hasn't started until user clicks Start
    };
    
    // Keep track of both the solved and shuffled grids
    this.solvedGrid = null;
    this.shuffledGrid = null;
  }
  
  componentDidMount() {
    this.initGame();
  }
  
  componentDidUpdate(prevProps) {
    // If level changes, reinitialize the game
    if (prevProps.level?.level !== this.props.level?.level) {
      console.log(`Level changed from ${prevProps.level?.level} to ${this.props.level?.level}, reinitializing game`);
      this.initGame();
    }
  }
  
  initGame() {
    try {      
      // Get level configuration with fallback
      const level = this.props?.level || { gridSize: 6, colorModifier: 1, moveLimit: 25 };
      
      console.log(`Initializing Hue Move game for level ${level.level}, color modifier: ${level.colorModifier}`);
      
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

      // Create solved grid first - ensure we use the current level's color modifier and contrast multiplier
      this.solvedGrid = hueMoveHelpers.generateSolvedHueMoveGrid(
        gridSize, 
        level.colorModifier, 
        level.contrastMultiplier || 1.0
      );
      
      // Then create the shuffled grid for gameplay
      this.shuffledGrid = hueMoveHelpers.shuffleHueMoveGrid(this.solvedGrid);
      
      // Reset game state - start by showing solution
      this.setState({ 
        moves: 0, 
        selectedPiece: null,
        gameOver: false,
        showDebugInfo: false,
        showingSolution: true,
        gameStarted: false
      });
      
      // Update the grid in Redux - start with the solved grid for preview
      if (typeof this.props?.createGrid === 'function') {
        this.props.createGrid(this.solvedGrid);
      }
      
      // Reset moves in Redux if available
      if (typeof this.props?.updateClicks === 'function') {
        this.props.updateClicks(0);
      }
      
      // Reset win state if previously won
      if (typeof this.props?.didWin === 'function') {
        this.props.didWin(null);
      }
      
      // Render the solution first
      this.renderBoard(this.solvedGrid);
      
      console.log(`Game initialized with grid size ${gridSize}x${gridSize}, color modifier ${level.colorModifier}`);
    } catch (error) {
      console.error('Error initializing game:', error);
    }
  }
  
  handleBoardLayout = (event) => {
    const { width } = event.nativeEvent.layout;
    this.setState({ boardSize: width });
  }
  
  // Start the game - switch from solution to shuffled board
  startGame = () => {    
    console.log(`Starting game with level ${this.props.level?.level}`);
    
    // Update Redux with the shuffled grid
    if (typeof this.props?.createGrid === 'function' && this.shuffledGrid) {
      this.props.createGrid(this.shuffledGrid);
    }
    
    // Update state to show we're now playing the game
    this.setState({
      showingSolution: false,
      gameStarted: true,
      moves: 0,
      selectedPiece: null
    });
    
    // Render the shuffled board
    this.renderBoard(this.shuffledGrid);
  }
  
  // We no longer need to toggle solution during gameplay, just keep for compatibility
  toggleSolution = () => {
    // No-op since we removed this functionality
  }
  
  handlePiecePress(index) {
    // If we're showing the solution or game hasn't started yet, don't allow piece interaction
    if (this.state.showingSolution || !this.state.gameStarted) {
      return;
    }
    
    const { grid } = this.props.game || {};
    if (!grid || !Array.isArray(grid)) {
      return;
    }
    
    // Convert flat index to 2D grid coordinates
    const gridSize = grid.length;
    const row = Math.floor(index / gridSize);
    const col = index % gridSize;
        
    // Validate row and column are in bounds
    if (row < 0 || row >= gridSize || col < 0 || col >= gridSize) {
      return;
    }
    
    // Check if the grid position exists
    if (!grid[row] || !grid[row][col]) {
      return;
    }
    
    // Get the piece at this position
    const piece = grid[row][col];
    
    // Safely check if this is a corner piece
    const isCorner = 
      (piece && piece.isCorner === true) ||
      (row === 0 && col === 0) ||
      (row === 0 && col === gridSize - 1) ||
      (row === gridSize - 1 && col === 0) ||
      (row === gridSize - 1 && col === gridSize - 1);
    
    // Don't allow selecting corner pieces
    if (isCorner) {
      return;
    }
    
    const { selectedPiece } = this.state;
    
    // If no piece is selected, select this one
    if (selectedPiece === null) {
      console.log(`Selecting piece at index ${index}`);
      this.setState({ selectedPiece: index }, () => {
        // Re-render the board immediately after state update to show selection
        this.renderBoard(grid);
      });
      return;
    }
    
    // If the same piece is selected, deselect it
    if (selectedPiece === index) {
      console.log(`Deselecting piece at index ${index}`);
      this.setState({ selectedPiece: null }, () => {
        // Re-render the board immediately after state update to clear selection
        this.renderBoard(grid);
      });
      return;
    }
    
    // Otherwise, swap the pieces
    console.log(`Swapping pieces at indices ${selectedPiece} and ${index}`);
    
    // Clear selection before swap to ensure no outline appears on any block
    this.setState({ selectedPiece: null }, () => {
      // Then swap the pieces after selection is cleared
      this.swapPieces(selectedPiece, index);
    });
  }
  
  swapPieces(index1, index2) {
    const { grid } = this.props.game || {};
    if (!grid || !Array.isArray(grid)) {
      return;
    }
    
    // Convert flat indices to 2D coordinates
    const gridSize = grid.length;
    const row1 = Math.floor(index1 / gridSize);
    const col1 = index1 % gridSize;
    const row2 = Math.floor(index2 / gridSize);
    const col2 = index2 % gridSize;
    
    // Validate positions are in bounds
    if (row1 < 0 || row1 >= gridSize || col1 < 0 || col1 >= gridSize ||
        row2 < 0 || row2 >= gridSize || col2 < 0 || col2 >= gridSize) {
      return;
    }
    
    // Validate grid positions exist
    if (!grid[row1] || !grid[row1][col1] || !grid[row2] || !grid[row2][col2]) {
      return;
    }
    
    // Create a deep copy of the grid
    const newGrid = JSON.parse(JSON.stringify(grid));
    
    // Get the pieces from the grid
    const piece1 = newGrid[row1][col1];
    const piece2 = newGrid[row2][col2];
    
    // Safely check if either piece is a corner
    const isCorner1 = 
      (piece1 && piece1.isCorner === true) ||
      (row1 === 0 && col1 === 0) ||
      (row1 === 0 && col1 === gridSize - 1) ||
      (row1 === gridSize - 1 && col1 === 0) ||
      (row1 === gridSize - 1 && col1 === gridSize - 1);
      
    const isCorner2 = 
      (piece2 && piece2.isCorner === true) ||
      (row2 === 0 && col2 === 0) ||
      (row2 === 0 && col2 === gridSize - 1) ||
      (row2 === gridSize - 1 && col2 === 0) ||
      (row2 === gridSize - 1 && col2 === gridSize - 1);
    
    // Don't allow swapping with corner pieces
    if (isCorner1 || isCorner2) {
      return;
    }
    
    console.log('Swapping pieces with NO selection active');
    
    // Swap the pieces
    const temp = newGrid[row1][col1];
    newGrid[row1][col1] = newGrid[row2][col2];
    newGrid[row2][col2] = temp;
    
    // Update move counter
    const newMoves = this.state.moves + 1;
    
    // Batch the state updates to prevent race conditions
    this.setState({ 
      moves: newMoves,
      selectedPiece: null // Ensure selection is cleared
    });
    
    // Update the moves counter in Redux
    if (typeof this.props?.updateClicks === 'function') {
      this.props.updateClicks(newMoves);
    }
    
    // Update the grid in Redux
    if (typeof this.props?.createGrid === 'function') {
      this.props.createGrid(newGrid);
    }
    
    // Re-render the board with the updated grid and no selection
    const renderTimeout = setTimeout(() => {
      console.log('Re-rendering after swap with NO selection');
      this.renderBoard(newGrid);
      clearTimeout(renderTimeout);
    }, 50);
    
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
    if (!grid || !Array.isArray(grid) || grid.length === 0) {
      return false;
    }
    
    // Check if each piece is in its original position
    for (let row = 0; row < grid.length; row++) {
      if (!grid[row] || !Array.isArray(grid[row])) {
        return false;
      }
      
      for (let col = 0; col < grid[row].length; col++) {
        const piece = grid[row][col];
        
        // Skip missing pieces (though this shouldn't happen)
        if (!piece) {
          return false;
        }
        
        // Skip checking corner pieces since they never move
        const isCorner = 
          (piece.isCorner === true) ||
          (row === 0 && col === 0) ||
          (row === 0 && col === grid.length - 1) ||
          (row === grid.length - 1 && col === 0) ||
          (row === grid.length - 1 && col === grid.length - 1);
          
        if (!isCorner && (piece.originalRow !== row || piece.originalCol !== col)) {
          // Piece is not in its original position
          return false;
        }
      }
    }
    
    // If we got here, all pieces are in their correct positions
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
    
    // Add delay before showing winner modal so user can see completed board
    setTimeout(() => {
      // Mark game as won - this will trigger the WinLose modal
      if (this.props.didWin) {
        this.props.didWin(true);
      }
    }, 1000); // 1 second delay
    
    // No need for an additional alert - the WinLose component will handle display
  }
  
  handleGameOver(won) {
    this.setState({ gameOver: true });
    
    if (this.props.didWin) {
      this.props.didWin(won);
    }
    
    // No need for an additional alert - the WinLose component will handle display
  }
  
  renderBoard(grid) {
    if (!grid || !Array.isArray(grid) || grid.length === 0) {
      return;
    }
    
    const gridSize = grid.length;
    const pieces = [];
    const { selectedPiece, boardSize } = this.state;
    
    console.log(`Rendering board with selectedPiece: ${selectedPiece}`);
    
    // Calculate dimensions with a small gap between pieces
    const gap = 2; // Gap between pieces in pixels
    const totalGapsWidth = gap * (gridSize - 1);
    const pieceSize = boardSize > 0 ? (boardSize - totalGapsWidth) / gridSize : 0;
    
    // If we don't have a valid board size yet, don't render pieces
    if (pieceSize <= 0) {
      return;
    }
        
    // Explicitly iterate through all grid positions
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        // Skip if grid position doesn't exist
        if (!grid[row] || !grid[row][col]) {
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
        
        // Check if this piece is selected - ONLY true if selectedPiece matches exactly
        const isSelected = (selectedPiece !== null) && (selectedPiece === index);
        
        if (isSelected) {
          console.log(`Rendering piece at index ${index} as SELECTED`);
        }
        
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
                borderWidth: isSelected ? 3 : 0,
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
    
    // Load the pieces into the Redux state
    if (typeof this.props?.loadBlocks === 'function') {
      this.props.loadBlocks(pieces);
    }
  }
  
  render() {
    const { game } = this.props || {};
    const { gameOver, moves, showingSolution, gameStarted } = this.state;
    const level = this.props.level || { level: 1, moveLimit: 25 };
    const blocks = game && game.blocks ? game.blocks : [];
    
    return (
      <View style={styles.boardContainer}>
        <View style={[
          styles.gameBoard,
          gameOver && styles.gameOver
        ]}>
          {/* No header as per the fixes image */}
          
          {/* Board area */}
          <View 
            style={styles.grid}
            onLayout={this.handleBoardLayout}
          >
            {blocks}
          </View>
          
          {/* Only Start Game or Restart Current Level buttons */}
          <View style={styles.instructionsContainer}>
            {!gameStarted ? (
              <TouchableOpacity 
                style={styles.startButton}
                onPress={this.startGame}
              >
                <Text style={styles.startButtonText}>
                  Start Game
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={styles.gameButton}
                onPress={() => this.initGame()}
              >
                <Text style={styles.buttonText}>
                  Restart Level {this.props.level?.level || 1}
                </Text>
              </TouchableOpacity>
            )}
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
  solutionBanner: {
    backgroundColor: 'rgba(25, 118, 210, 0.8)',
    borderRadius: 4
  },
  movesText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white'
  },
  solutionText: {
    fontSize: 18,
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
    marginBottom: 15,
    marginTop: 25,
    position: 'relative'
  },
  piece: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    margin: 0
  },
  touchArea: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible'
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
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center'
  },
  debugText: {
    fontSize: 10,
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
    fontWeight: 'bold'
  },
  startButton: {
    backgroundColor: '#FF6B00',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 6,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  // Button styles
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    width: '100%',
    flexWrap: 'wrap'
  },
  gameButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    backgroundColor: '#4CAF50',
    borderRadius: 6,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  debugButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    marginHorizontal: 5,
    marginVertical: 5
  },
  debugButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600'
  }
});