import React, { Component } from 'react';
import { View, Text, StyleSheet, PanResponder, Animated, TouchableOpacity } from 'react-native';
import * as hueMoveHelpers from '../../helpers/hueMoveMode.js';

export default class HueMoveDnDBoard extends Component {
  constructor(props) {
    super(props);
    
    // Configuration constants
    this.GRID_SIZE = 5;
    this.CELL_SIZE = 60;
    this.GAP = 4;
    this.BOARD_PADDING = 10;
    
    // Configuration for color generation
    const gridSize = this.GRID_SIZE;
    const colorModifier = 3; // Try different values (1-6) for different color schemes
    const contrastMultiplier = 1.2;
    const stage = 3; // 1, 2, or 3 for different gradient stages
    const generatorType = 'spiral'; // Options: classic, smooth, highContrast, subtle, radial, spiral, wave, diagonal
    
    // Generate the solved color grid using helpers
    this.solvedGrid = hueMoveHelpers.generateSolvedHueMoveGrid(
      gridSize,
      colorModifier,
      contrastMultiplier,
      stage,
      generatorType
    );
    
    // Create shuffled version for when game starts
    this.shuffledGrid = hueMoveHelpers.shuffleHueMoveGrid(this.solvedGrid);
    
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
      puzzleSolved: false
    };
    
    // Initialize pans and pan responders
    this.pans = {};
    this.panResponders = {};
    
    // Create pan responders
    this.createPanResponders();
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
            console.log("Game not started or showing solution - can't drag");
            return false;
          }
          
          // Don't allow dragging corner pieces
          if (piece.isCorner) {
            console.log(`Can't drag corner piece at [${piece.originalRow},${piece.originalCol}]`);
            return false;
          }
          return true;
        },
        onPanResponderGrant: () => {
          console.log(`Started dragging piece ${piece.id}`);
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
          console.log(`Released piece ${piece.id}`);
          this.pans[piece.id].flattenOffset();
          
          // Find the closest piece to swap with
          const { id, x, y } = piece;
          const currentPosition = this.pans[id].__getValue();
          const closestPiece = this.findClosestPiece(id, x + currentPosition.x, y + currentPosition.y);
          
          if (closestPiece) {
            console.log(`Swapping with piece ${closestPiece.id}`);
            this.swapPieces(id, closestPiece.id);
          } else {
            // No close piece found, animate back to original position
            console.log(`Returning piece ${piece.id} to original position`);
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
    
    // Get piece size from class configuration
    const PIECE_SIZE = this.CELL_SIZE;
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
  
  // Helper method to convert a 2D grid to a flat array of pieces with positions
  gridToFlatPieces(grid) {
    const pieces = [];
    let id = 1;
    
    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[row].length; col++) {
        const gridPiece = grid[row][col];
        pieces.push({
          id: id,
          color: gridPiece.color,
          originalRow: gridPiece.originalRow,
          originalCol: gridPiece.originalCol,
          isCorner: gridPiece.isCorner,
          x: this.BOARD_PADDING + col * (this.CELL_SIZE + this.GAP),
          y: this.BOARD_PADDING + row * (this.CELL_SIZE + this.GAP)
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
    
    console.log('Game started - you can now drag and drop pieces to solve the puzzle');
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
    
    console.log('Level reset - showing solution');
  }
  
  // Check if the puzzle is solved (all pieces in correct positions)
  checkIfSolved = () => {
    const { pieces } = this.state;
    
    // Algorithm: each piece should be in the position corresponding to its originalRow and originalCol
    for (const piece of pieces) {
      // Skip corners as they never move
      if (piece.isCorner) continue;
      
      // Get the row and column of this piece based on its current position
      const row = Math.floor((piece.y - this.BOARD_PADDING) / (this.CELL_SIZE + this.GAP));
      const col = Math.floor((piece.x - this.BOARD_PADDING) / (this.CELL_SIZE + this.GAP));
      
      // Check if the piece is in its original position
      if (row !== piece.originalRow || col !== piece.originalCol) {
        // If any piece is out of place, the puzzle is not solved
        return;
      }
    }
    
    // All pieces are in their original positions
    console.log('Puzzle solved!');
    this.setState({ puzzleSolved: true });
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
    this.setState({ pieces }, () => {
      // Reset the pan responders for the new piece positions
      this.resetPanResponders();
      
      // Check if the puzzle is solved after the swap
      this.checkIfSolved();
    });
  }
  
  render() {
    const { draggedPieceId, exchangePieceId, showingSolution, gameStarted, puzzleSolved } = this.state;
    
    return (
      <View style={styles.container}>
        <Text style={styles.title}>HueMove Drag and Drop</Text>
        
        {/* Game status text */}
        {showingSolution && (
          <Text style={styles.statusText}>
            Memorize the pattern, then press Start Level to begin
          </Text>
        )}
        
        {!showingSolution && gameStarted && !puzzleSolved && (
          <Text style={styles.statusText}>
            Drag pieces to recreate the pattern
          </Text>
        )}
        
        {!showingSolution && gameStarted && puzzleSolved && (
          <Text style={styles.winText}>
            🎉 Congratulations! Puzzle solved! 🎉
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
                  zIndex: draggedPieceId === piece.id ? 10 : 1,
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
                onPress={this.resetLevel}
              >
                <Text style={styles.buttonText}>Next Level</Text>
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
  },
  piece: {
    width: 60,
    height: 60,
    borderRadius: 30,
    position: 'absolute',
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
  }
});