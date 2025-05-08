import React, { Component } from 'react';
import { View, Text, StyleSheet, PanResponder, Animated, TouchableOpacity } from 'react-native';
import * as hueMoveHelpers from '../../helpers/hueMoveMode.js';

export default class HueMoveDnDBoard extends Component {
  constructor(props) {
    super(props);
    
    // Configuration constants
    this.BASE_GRID_SIZE = 5;
    this.CELL_SIZE = 64;
    this.GAP = 4;
    this.BOARD_PADDING = 10;
    
    // Set initial level properties
    this.currentLevel = 1;
    this.maxLevel = 15; // Maximum number of levels
    
    // Initialize the first level with the appropriate grid size
    this.initializeLevel(this.currentLevel);
    
    // Log the grid size for debugging
    const initialGridSize = this.getGridSizeForLevel(this.currentLevel);
    console.log(`Initial grid size for level ${this.currentLevel}: ${initialGridSize}x${initialGridSize}`);
    
    // Convert the solved 2D grid to a flat array of pieces with proper positioning
    const pieces = this.gridToFlatPieces(this.solvedGrid);
    
    // Set showingSolution flag to true initially
    this.showingSolution = true;
    
    this.state = {
      pieces,
      draggedPieceId: null,
      exchangePieceId: null,
      showingSolution: true,
      gameStarted: false,
      puzzleSolved: false,
      currentLevel: this.currentLevel,
      moves: 0
    };
    
    // Initialize pans and pan responders
    this.pans = {};
    this.panResponders = {};
    
    // Create pan responders
    this.createPanResponders();
  }
  
  // Get configuration for a specific level
  getLevelConfig(level) {
    // Array of all available generator types
    const generatorTypes = [
      'classic',     // Traditional gradient
      'smooth',      // Smooth transitions
      'highContrast', // Bold color differences
      'subtle',      // Subtle variations
      'radial',      // Radial pattern
      'spiral',      // Spiral pattern
      'wave',        // Wave-like pattern
      'diagonal'     // Diagonal gradient
    ];
    
    // Define our custom level progression pattern
    // We use level 15, 25, 35, 45, 55, 65, then 16, 26, 36, 46, etc.
    
    // First determine which "decade" (tens digit) we're in
    const customLevelSets = [
      [15, 25, 35, 45, 55, 65],  // First set of levels
      [16, 26, 36, 46],          // Second set of levels
      [17, 27, 37],          // Third set of levels 
      [18, 28, 38]           // Fourth set of levels
    ];
    
    // Calculate which set and which position in the set we're using
    const setIndex = Math.floor((level - 1) / customLevelSets[0].length) % customLevelSets.length;
    const positionIndex = (level - 1) % customLevelSets[0].length;
    
    // Get the appropriate custom level
    if (setIndex < customLevelSets.length && positionIndex < customLevelSets[setIndex].length) {
      const customStage = customLevelSets[setIndex][positionIndex];
      
      return {
        colorModifier: 1,
        contrastMultiplier: 1.0,
        stage: customStage,
        generatorType: 'classic'
      };
    }
    
    // For levels beyond the first 3, create more randomized configurations
    // Use the level number to seed a deterministic but varied selection
    
    // Select generator type based on level, but add variation
    // Use prime numbers to create non-repeating patterns
    const levelPrime = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61];
    const primeIndex = (level - 1) % levelPrime.length;
    const generatorIndex = (level * levelPrime[primeIndex]) % generatorTypes.length;
    
    // Select a colorModifier (1-6) that varies with level
    // Use a different prime pattern to avoid synchronization with generatorType
    const colorPrimeOffset = levelPrime[(primeIndex + 3) % levelPrime.length];
    const colorModifier = ((level * colorPrimeOffset) % 6) + 1;
    
    // Calculate contrast multiplier - decrease as levels progress
    const contrastBase = 1.4;
    const contrastDecay = 0.03;
    const contrastMultiplier = Math.max(1.0, contrastBase - ((level - 1) * contrastDecay));
    
    // Set stage (1-3) using another prime pattern
    const stagePrimeOffset = levelPrime[(primeIndex + 7) % levelPrime.length];
    const stage = ((level * stagePrimeOffset) % 3) + 1;
    
    return {
      colorModifier,
      contrastMultiplier,
      stage,
      generatorType: generatorTypes[generatorIndex]
    };
  }
  
  // Calculate grid size based on level
  getGridSizeForLevel(level) {
    // Increase grid size every 5 levels
    // Level 1-5: 5x5 grid
    // Level 6-10: 6x6 grid
    // Level 11-15: 7x7 grid
    const levelTier = Math.ceil(level / 5);
    return this.BASE_GRID_SIZE + Math.min(2, levelTier - 1); // Increase grid size, max 7x7
  }
  
  // Initialize a specific level
  initializeLevel(level) {
    // Calculate grid size based on level
    const gridSize = this.getGridSizeForLevel(level);
    
    // Different level configurations
    const levelConfig = this.getLevelConfig(level);
    const { colorModifier, contrastMultiplier, stage, generatorType } = levelConfig;
    
    console.log(`Initializing level ${level} with ${generatorType} generator, modifier: ${colorModifier}, stage: ${stage}`);
    
    // Define custom level progression
    const customStages = [15, 16, 17, 18, 25, 26, 27, 28, 35, 36, 37, 38, 45, 46, 47, 48, 55, 65];
    
    try {
      // Generate the solved color grid using the appropriate method
      if (customStages.includes(stage)) {
        // Check if the custom grid exists by trying to generate it first
        const customGrid = hueMoveHelpers.generateCustomLevelGrid(`level${stage}`, gridSize);
        
        if (customGrid) {
          console.log(`Using custom level${stage} grid`);
          this.solvedGrid = customGrid;
        } else {
          const randomSeed = Math.floor(Math.random() * 1000) + (level * 100);
          this.solvedGrid = hueMoveHelpers.generateSolvedHueMoveGrid(
            gridSize,
            colorModifier,
            contrastMultiplier,
            1, // Use stage 1 as fallback
            generatorType,
            randomSeed
          );
        }
      } else {
        // For other levels, use procedural generation with random seed for variety
        const randomSeed = Math.floor(Math.random() * 1000) + (level * 100);
        
        this.solvedGrid = hueMoveHelpers.generateSolvedHueMoveGrid(
          gridSize,
          colorModifier,
          contrastMultiplier,
          stage,
          generatorType,
          randomSeed // Pass the random seed to influence color generation
        );
      }
      
      // Verify the grid was created successfully
      if (!this.solvedGrid || !Array.isArray(this.solvedGrid) || this.solvedGrid.length !== gridSize) {
        throw new Error('Failed to generate a valid grid');
      }
      
      // Create shuffled version for when game starts
      this.shuffledGrid = hueMoveHelpers.shuffleHueMoveGrid(this.solvedGrid);
      
    } catch (error) {
      console.error(`Error initializing level: ${error.message}`);
      
      // Create a fallback grid - simple procedurally generated colors
      this.solvedGrid = [];
      for (let row = 0; row < gridSize; row++) {
        this.solvedGrid[row] = [];
        for (let col = 0; col < gridSize; col++) {
          const isCorner =
            (row === 0 && col === 0) ||
            (row === 0 && col === gridSize - 1) ||
            (row === gridSize - 1 && col === 0) ||
            (row === gridSize - 1 && col === gridSize - 1);
          
          // Generate a simple gradient
          const r = Math.floor((row / gridSize) * 255);
          const g = Math.floor((col / gridSize) * 255);
          const b = Math.floor(((row + col) / (2 * gridSize)) * 255);
          
          this.solvedGrid[row][col] = {
            color: `rgb(${r}, ${g}, ${b})`,
            originalRow: row,
            originalCol: col,
            isCorner: isCorner
          };
        }
      }
      
      // Create shuffled version
      this.shuffledGrid = hueMoveHelpers.shuffleHueMoveGrid(this.solvedGrid);
    }
  }
  
  // Create pan responders for all pieces
  createPanResponders = () => {
    const { pieces } = this.state;
    
    pieces.forEach(piece => {
      // Initialize pan if it doesn't exist
      if (!this.pans[piece.id]) {
        this.pans[piece.id] = new Animated.ValueXY();
      }
      
      // Create or recreate the pan responder
      this.panResponders[piece.id] = PanResponder.create({
        onStartShouldSetPanResponder: () => {
          // Only allow dragging if the game has started and we're not showing the solution
          if (this.state.showingSolution || !this.state.gameStarted) {
            return false;
          }
          
          // Don't allow dragging corner pieces
          if (piece.isCorner) {
            return false;
          }
          return true;
        },
        onPanResponderGrant: () => {
          this.setState({ draggedPieceId: piece.id });
          this.pans[piece.id].setOffset({
            x: this.pans[piece.id].__getValue().x,
            y: this.pans[piece.id].__getValue().y
          });
          this.pans[piece.id].setValue({ x: 0, y: 0 });
        },
        onPanResponderMove: Animated.event([
          null, 
          { dx: this.pans[piece.id].x, dy: this.pans[piece.id].y }
        ], { 
          useNativeDriver: false,
          listener: (_, gestureState) => {
            // Find the closest piece during drag
            const { dx, dy } = gestureState;
            const { id, x, y } = piece;
            const dragX = x + dx;
            const dragY = y + dy;
            const closestPiece = this.findClosestPiece(id, dragX, dragY);
            
            // Update the exchange piece if it changed
            if (closestPiece) {
              this.setState({ exchangePieceId: closestPiece.id });
            } else {
              this.setState({ exchangePieceId: null });
            }
          }
        }),
        onPanResponderRelease: () => {
          this.pans[piece.id].flattenOffset();
          
          // Find the closest piece to swap with
          const { id, x, y } = piece;
          const currentPosition = this.pans[id].__getValue();
          const closestPiece = this.findClosestPiece(id, x + currentPosition.x, y + currentPosition.y);
          
          if (closestPiece) {
            this.swapPieces(id, closestPiece.id);
          } else {
            // No close piece found, animate back to original position
            Animated.spring(this.pans[id], {
              toValue: { x: 0, y: 0 },
              friction: 5,
              tension: 40,
              useNativeDriver: false
            }).start();
          }
          
          // Clear the dragged piece id and exchange piece id
          this.setState({ 
            draggedPieceId: null,
            exchangePieceId: null
          });
        }
      });
    });
  }
  
  findClosestPiece(pieceId, x, y) {
    const currentPiece = this.state.pieces.find(p => p.id === pieceId);
    if (!currentPiece) return null;
    
    let closestPiece = null;
    let closestDistance = Number.MAX_VALUE;
    
    // Get piece size from the piece itself (dynamic based on grid size)
    const PIECE_SIZE = currentPiece.size || this.CELL_SIZE;
    // The distance threshold is 75% of the piece size
    const DISTANCE_THRESHOLD = PIECE_SIZE * 0.75;
    
    this.state.pieces.forEach(piece => {
      // Skip the dragged piece and corner pieces
      if (piece.id === pieceId || piece.isCorner) return;
      
      const piecePos = this.pans[piece.id].__getValue();
      const distance = Math.sqrt(
        Math.pow(x - (piece.x + piecePos.x), 2) + 
        Math.pow(y - (piece.y + piecePos.y), 2)
      );
      
      if (distance < closestDistance) {
        closestPiece = piece;
        closestDistance = distance;
      }
    });
    
    // Only return the closest piece if it's within the threshold distance
    return closestDistance < DISTANCE_THRESHOLD ? closestPiece : null;
  }
  
  // Helper method to calculate cell size based on grid size
  getCellSizeForGridSize(gridSize) {
    // Dynamically adjust cell size based on grid size to fit the board
    // Base size is 60px for 5x5 grid
    const maxBoardWidth = 320; // Maximum board width
    const totalGaps = gridSize - 1;
    const availableSpace = maxBoardWidth - (this.BOARD_PADDING * 2) - (this.GAP * totalGaps);
    const cellSize = Math.floor(availableSpace / gridSize);
    
    return Math.min(this.CELL_SIZE, cellSize);
  }
  
  // Helper method to convert a 2D grid to a flat array of pieces with positions
  gridToFlatPieces(grid) {
    const pieces = [];
    let id = 1;
    
    // Calculate appropriate cell size based on the grid size
    const gridSize = grid.length;
    const cellSize = this.getCellSizeForGridSize(gridSize);
    
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < grid[row].length; col++) {
        const gridPiece = grid[row][col];
        pieces.push({
          id: id,
          color: gridPiece.color,
          originalRow: gridPiece.originalRow,
          originalCol: gridPiece.originalCol,
          isCorner: gridPiece.isCorner,
          x: this.BOARD_PADDING + col * (cellSize + this.GAP),
          y: this.BOARD_PADDING + row * (cellSize + this.GAP),
          size: cellSize // Store the cell size with each piece
        });
        id++;
      }
    }
    
    return pieces;
  }
  
  // Start the level - switch from solution to shuffled board
  startLevel = () => {
    const shuffledPieces = this.gridToFlatPieces(this.shuffledGrid);
    
    this.setState({
      pieces: shuffledPieces,
      showingSolution: false,
      gameStarted: true,
      puzzleSolved: false
    }, () => {
      // Reset all panResponders and pans for the new piece positions
      this.resetPanResponders();
    });
  }
  
  // Reset all PanResponders
  resetPanResponders = () => {
    // Reset all pans
    this.state.pieces.forEach(piece => {
      if (this.pans[piece.id]) {
        this.pans[piece.id].setValue({ x: 0, y: 0 });
      }
    });
    
    // Recreate all pan responders based on current piece positions
    this.createPanResponders();
  }
  
  // Reset the level - switch back to the solution view
  resetLevel = () => {
    const solvedPieces = this.gridToFlatPieces(this.solvedGrid);
    
    this.setState({
      pieces: solvedPieces,
      showingSolution: true,
      gameStarted: false,
      draggedPieceId: null,
      exchangePieceId: null,
      puzzleSolved: false
    }, () => {
      // Reset all panResponders for the new piece positions
      this.resetPanResponders();
    });
  }
  
  // Advance to the next level
  nextLevel = () => {
    // Update the current level, wrapping around if we reach the maximum
    if (this.currentLevel >= this.maxLevel) {
      this.currentLevel = 1;
    } else {
      // Increment the level
      this.currentLevel += 1;
    }
    
    // Initialize the new level
    this.initializeLevel(this.currentLevel);
    
    // Convert the solved 2D grid to a flat array of pieces
    const solvedPieces = this.gridToFlatPieces(this.solvedGrid);
    
    // Update the state with the new level information
    this.setState({
      pieces: solvedPieces,
      showingSolution: true,
      gameStarted: false,
      draggedPieceId: null,
      exchangePieceId: null,
      puzzleSolved: false,
      currentLevel: this.currentLevel,
      moves: 0
    }, () => {
      // Reset all panResponders for the new piece positions
      this.resetPanResponders();
    });
  }
  
  // Check if the puzzle is solved (all pieces in correct positions)
  checkIfSolved = () => {
    const { pieces, currentLevel } = this.state;
    
    // Get the current grid size and cell size
    const gridSize = this.getGridSizeForLevel(currentLevel);
    const cellSize = this.getCellSizeForGridSize(gridSize);
    
    // Algorithm: each piece should be in the position corresponding to its originalRow and originalCol
    for (const piece of pieces) {
      // Skip corners as they never move
      if (piece.isCorner) continue;
      
      // Get the row and column of this piece based on its current position
      // Using the cell size appropriate for this grid
      const row = Math.floor((piece.y - this.BOARD_PADDING) / (cellSize + this.GAP));
      const col = Math.floor((piece.x - this.BOARD_PADDING) / (cellSize + this.GAP));
      
      // Check if the piece is in its original position
      if (row !== piece.originalRow || col !== piece.originalCol) {
        // If any piece is out of place, the puzzle is not solved
        return;
      }
    }
    
    // All pieces are in their original positions
    const isFinalLevel = currentLevel >= this.maxLevel;
    
    console.log(`Puzzle solved! ${isFinalLevel ? 'This is the final level!' : ''}`);
    this.setState({ 
      puzzleSolved: true 
    });
  }
  
  swapPieces(id1, id2) {
    const pieces = [...this.state.pieces];
    const piece1 = pieces.find(p => p.id === id1);
    const piece2 = pieces.find(p => p.id === id2);
    
    if (!piece1 || !piece2) return;
    
    // Don't swap if either piece is a corner (should be already checked, but just to be safe)
    if (piece1.isCorner || piece2.isCorner) {
      console.log("Can't swap with corner pieces");
      return;
    }
    
    // Swap the positions
    const tempX = piece1.x;
    const tempY = piece1.y;
    piece1.x = piece2.x;
    piece1.y = piece2.y;
    piece2.x = tempX;
    piece2.y = tempY;
    
    // Reset the animated values
    this.pans[id1].setValue({ x: 0, y: 0 });
    this.pans[id2].setValue({ x: 0, y: 0 });
    
    // Update state
    this.setState({ 
      pieces,
      moves: this.state.moves + 1
    }, () => {
      // Reset the pan responders for the new piece positions
      this.resetPanResponders();
      
      // Check if the puzzle is solved after the swap
      this.checkIfSolved();
    });
  }
  
  render() {
    const { draggedPieceId, exchangePieceId, showingSolution, gameStarted, puzzleSolved, currentLevel } = this.state;
    
    return (
      <View style={styles.container}>
        <Text style={styles.title}>HueMove Drag and Drop - Level {currentLevel}</Text>
        
        {/* Game status text */}
        {showingSolution && (
          <Text style={styles.statusText}>
            Level {currentLevel}: Memorize the pattern, then press Start Level to begin
          </Text>
        )}
        
        {!showingSolution && gameStarted && !puzzleSolved && (
          <Text style={styles.statusText}>
            Level {currentLevel}: Drag pieces to recreate the pattern
          </Text>
        )}
        
        {!showingSolution && gameStarted && puzzleSolved && (
          <Text style={styles.winText}>
            🎉 Congratulations! Level {currentLevel} completed! 🎉
            {currentLevel >= this.maxLevel && "\nYou've completed the final level! Try again from Level 1."}
          </Text>
        )}
        
        <View style={styles.board}>
          {this.state.pieces.map(piece => (
            <Animated.View
              key={piece.id}
              style={[
                styles.piece,
                {
                  backgroundColor: piece.color,
                  left: Animated.add(piece.x, this.pans[piece.id].x),
                  top: Animated.add(piece.y, this.pans[piece.id].y),
                  width: piece.size || this.CELL_SIZE,
                  height: piece.size || this.CELL_SIZE,
                  borderRadius: (piece.size || this.CELL_SIZE) / 2,
                  zIndex: draggedPieceId === piece.id ? 10 : (exchangePieceId === piece.id ? 5 : 1),
                  borderWidth: piece.isCorner ? 3 : (draggedPieceId === piece.id ? 2 : 0),
                  borderColor: piece.isCorner ? '#FFFFFF' : (draggedPieceId === piece.id ? 'white' : 'transparent'),
                  opacity: exchangePieceId === piece.id ? 0.5 : 1,
                }
              ]}
              {...this.panResponders[piece.id].panHandlers}
            />
          ))}
        </View>
        
        {/* Buttons */}
        <View style={styles.buttonContainer}>
          {/* Start button */}
          {showingSolution && !gameStarted && (
            <TouchableOpacity 
              style={styles.startButton}
              onPress={this.startLevel}
            >
              <Text style={styles.startButtonText}>Start Level</Text>
            </TouchableOpacity>
          )}
          
          {/* Reset button during gameplay */}
          {!showingSolution && gameStarted && !puzzleSolved && (
            <TouchableOpacity 
              style={styles.resetButton}
              onPress={this.resetLevel}
            >
              <Text style={styles.buttonText}>Reset Level</Text>
            </TouchableOpacity>
          )}
          
          {/* Next Level and Reset buttons when puzzle is solved */}
          {!showingSolution && gameStarted && puzzleSolved && (
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={styles.resetButton}
                onPress={this.resetLevel}
              >
                <Text style={styles.buttonText}>Reset Level</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.nextButton}
                onPress={this.nextLevel}
              >
                <Text style={styles.buttonText}>
                  {currentLevel >= this.maxLevel ? 'Start Over (Level 1)' : 'Next Level'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: 'white',
  },
  statusText: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    marginBottom: 15,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  winText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'yellow',
    textAlign: 'center',
    marginBottom: 15,
    backgroundColor: 'rgba(76,175,80,0.6)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  board: {
    width: 340,
    height: 340,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 10,
    position: 'relative',
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  piece: {
    position: 'absolute',
    // width and height set dynamically
    // borderRadius set dynamically
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  startButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 6,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  resetButton: {
    backgroundColor: '#F44336',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 6,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 300,
  },
  nextButton: {
    backgroundColor: '#2196F3', // Blue color
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 6,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    marginLeft: 10,
  },
  disabledButton: {
    backgroundColor: '#B0BEC5', // Gray color
    opacity: 0.7,
    elevation: 0,
    shadowOpacity: 0,
  }
});