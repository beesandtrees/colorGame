/**
 * DnD Match 3 Simple Component
 * 
 * This is a modified version of the DND-example component for building a match-3 game.
 * It uses the same core drag and drop functionality but will be adapted for match-3 gameplay.
 */

import React, { Component } from 'react';
import { View, Text, StyleSheet, PanResponder, Animated } from 'react-native';
import * as match3Helpers from '../../helpers/match3Mode.js';
import { MATCH3_MODE } from '../../helpers/constants.js';

export default class DnDMatch3Simple extends Component {
  constructor(props) {
    super(props);
    
    try {
      // Configuration constants
      this.GRID_SIZE = 8; // Increase grid to 8x8
      this.CELL_SIZE = 36; // Smaller cell size to fit the larger grid
      this.GAP = 4;
      this.BOARD_PADDING = 10;
      
      // Define a set of 6 colors for match-3 gameplay
      this.matchColors = [
        '#FF5252', // Red
        '#FFEB3B', // Yellow
        '#66BB6A', // Green
        '#42A5F5', // Blue
        '#9575CD', // Purple
        '#FF7F50'  // Orange
      ];
      
      // Initialize empty collections to avoid undefined errors
      this.pans = {};
      this.panResponders = {};
      
      // Set basic initial state
      this.state = {
        pieces: [],
        draggedPieceId: null,
        exchangePieceId: null,
        score: 0,
        moves: 0
      };
      
      // Generate grid without initial matches
      const pieces = this.generateGridWithoutMatches();
      
      // Update state with generated pieces
      this.state.pieces = pieces;
      
      // Initialize the pan responders after pieces are set
      this.createPanResponders();
    } catch (error) {
      console.error("Error in constructor:", error);
      
      // Fallback to empty state if there's an error
      this.pans = {};
      this.panResponders = {};
      this.state = {
        pieces: [],
        draggedPieceId: null,
        exchangePieceId: null,
        score: 0,
        moves: 0
      };
    }
  }
  
  // Helper method to create/recreate pan responders 
  createPanResponders = () => {
    try {
      const { pieces } = this.state;
      
      if (!pieces || !Array.isArray(pieces)) {
        console.error("Invalid pieces array in createPanResponders");
        return;
      }
      
      // Safety measure: Remove any pan responders for pieces that no longer exist
      const pieceIds = new Set(pieces.map(p => p.id));
      Object.keys(this.pans).forEach(id => {
        if (!pieceIds.has(parseInt(id, 10)) && !pieceIds.has(id)) {
          delete this.pans[id];
          delete this.panResponders[id];
        }
      });
      
      pieces.forEach(piece => {
        try {
          if (!piece || !piece.id) {
            console.error("Invalid piece in createPanResponders");
            return;
          }
          
          // Initialize pan value if it doesn't exist
          if (!this.pans[piece.id]) {
            this.pans[piece.id] = new Animated.ValueXY();
          }
          
          // Create or recreate the pan responder
          this.panResponders[piece.id] = PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
              try {
                console.log(`Started dragging piece ${piece.id}`);
                this.setState({ draggedPieceId: piece.id });
                
                // Safely get current position
                let currentX = 0;
                let currentY = 0;
                
                try {
                  const position = this.pans[piece.id].__getValue();
                  currentX = position.x || 0;
                  currentY = position.y || 0;
                } catch (e) {
                  console.error(`Error getting position for piece ${piece.id}:`, e);
                }
                
                this.pans[piece.id].setOffset({
                  x: currentX,
                  y: currentY
                });
                this.pans[piece.id].setValue({ x: 0, y: 0 });
              } catch (e) {
                console.error(`Error in onPanResponderGrant for piece ${piece.id}:`, e);
              }
            },
            onPanResponderMove: (_, gestureState) => {
              try {
                // Get raw drag values
                const { dx, dy } = gestureState;
                const { id, x, y } = piece;
                
                // Calculate the maximum distance a piece can be dragged (1 cell width)
                const maxDragDistance = this.CELL_SIZE + this.GAP;
                
                // Limit the drag distance without changing direction
                let limitedDx = dx;
                let limitedDy = dy;
                
                // Apply distance limit while preserving direction
                if (Math.abs(dx) > maxDragDistance) {
                  limitedDx = Math.sign(dx) * maxDragDistance;
                }
                
                if (Math.abs(dy) > maxDragDistance) {
                  limitedDy = Math.sign(dy) * maxDragDistance;
                }
                
                // Safely update animation values
                if (this.pans[piece.id]) {
                  this.pans[piece.id].setValue({ x: limitedDx, y: limitedDy });
                }
                
                // Use limited values for hit detection
                const dragX = x + limitedDx;
                const dragY = y + limitedDy;
                const closestPiece = this.findClosestPiece(id, dragX, dragY);
                
                // Update the exchange piece if it changed
                if (closestPiece) {
                  this.setState({ exchangePieceId: closestPiece.id });
                } else {
                  this.setState({ exchangePieceId: null });
                }
              } catch (e) {
                console.error(`Error in onPanResponderMove for piece ${piece.id}:`, e);
              }
            },
            onPanResponderRelease: () => {
              try {
                console.log(`Released piece ${piece.id}`);
                
                // Safely flatten offset
                if (this.pans[piece.id]) {
                  this.pans[piece.id].flattenOffset();
                } else {
                  console.error(`Pan responder missing for piece ${piece.id}`);
                  return;
                }
                
                // Find the closest piece to swap with
                const { id, x, y } = piece;
                
                // Safely get current position
                let currentX = 0;
                let currentY = 0;
                
                try {
                  const position = this.pans[id].__getValue();
                  currentX = position.x || 0;
                  currentY = position.y || 0;
                } catch (e) {
                  console.error(`Error getting position for piece ${piece.id}:`, e);
                }
                
                // Find closest piece using the current position
                const closestPiece = this.findClosestPiece(id, x + currentX, y + currentY);
                
                if (closestPiece) {
                  console.log(`Swapping with piece ${closestPiece.id}`);
                  this.swapPieces(id, closestPiece.id);
                  
                  // Increment moves counter
                  this.setState(prevState => ({
                    moves: prevState.moves + 1
                  }));
                } else {
                  // No close piece found, animate back to original position
                  console.log(`Returning piece ${piece.id} to original position`);
                  
                  if (this.pans[id]) {
                    Animated.spring(this.pans[id], {
                      toValue: { x: 0, y: 0 },
                      friction: 5,
                      tension: 40,
                      useNativeDriver: false
                    }).start();
                  }
                }
                
                // Clear the dragged piece id and exchange piece id
                this.setState({ 
                  draggedPieceId: null,
                  exchangePieceId: null
                });
              } catch (e) {
                console.error(`Error in onPanResponderRelease for piece ${piece.id}:`, e);
                
                // Try to reset to a safe state
                this.setState({ 
                  draggedPieceId: null,
                  exchangePieceId: null
                });
              }
            }
          });
        } catch (e) {
          console.error(`Error creating pan responder for piece ${piece?.id}:`, e);
        }
      });
    } catch (e) {
      console.error("Error in createPanResponders:", e);
    }
  };
  
  findClosestPiece(pieceId, x, y) {
    const currentPiece = this.state.pieces.find(p => p.id === pieceId);
    if (!currentPiece) return null;
    
    let closestPiece = null;
    let closestDistance = Number.MAX_VALUE;
    
    // Get piece size from class configuration
    const PIECE_SIZE = this.CELL_SIZE;
    // The distance threshold is 75% of the piece size
    const DISTANCE_THRESHOLD = PIECE_SIZE * 0.75;
    
    // Get the row/col of the current piece
    const currentRow = currentPiece.row;
    const currentCol = currentPiece.col;
    
    // In match-3 games, we can only swap with adjacent pieces (up, down, left, right)
    // Create a list of the four adjacent positions
    const adjacentPositions = [
      { row: currentRow - 1, col: currentCol },     // up
      { row: currentRow + 1, col: currentCol },     // down
      { row: currentRow, col: currentCol - 1 },     // left
      { row: currentRow, col: currentCol + 1 }      // right
    ];
    
    // Filter the pieces to only consider those in adjacent positions
    const adjacentPieces = this.state.pieces.filter(piece => {
      return adjacentPositions.some(pos => 
        pos.row === piece.row && pos.col === piece.col
      );
    });
    
    // Now find the closest among the adjacent pieces
    adjacentPieces.forEach(piece => {
      if (piece.id === pieceId) return;
      
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
  
  swapPieces(id1, id2) {
    const pieces = [...this.state.pieces];
    const piece1 = pieces.find(p => p.id === id1);
    const piece2 = pieces.find(p => p.id === id2);
    
    if (!piece1 || !piece2) return;
    
    // Swap the positions
    const tempX = piece1.x;
    const tempY = piece1.y;
    const tempRow = piece1.row;
    const tempCol = piece1.col;
    
    piece1.x = piece2.x;
    piece1.y = piece2.y;
    piece1.row = piece2.row;
    piece1.col = piece2.col;
    
    piece2.x = tempX;
    piece2.y = tempY;
    piece2.row = tempRow;
    piece2.col = tempCol;
    
    // Reset the animated values gradually with animation
    Animated.timing(this.pans[id1], {
      toValue: { x: 0, y: 0 },
      duration: 50,
      useNativeDriver: false
    }).start();
    
    Animated.timing(this.pans[id2], {
      toValue: { x: 0, y: 0 },
      duration: 50,
      useNativeDriver: false
    }).start();
    
    // Update state
    this.setState({ pieces });
    
    // For now, just update the Redux store moves count
    if (this.props.updateClicks) {
      this.props.updateClicks(this.state.moves);
    }
    
    // Update pan responders with new piece positions
    this.createPanResponders();
    
    // Check for matches after the swap
    this.checkForMatches();
  }
  
  // Generate a grid without any initial matches
  generateGridWithoutMatches() {
    const pieces = [];
    let id = 1;
    
    // Create a 2D array to represent the grid for easier color validation
    const grid = Array(this.GRID_SIZE).fill().map(() => Array(this.GRID_SIZE).fill(null));
    
    // Fill the grid with pieces, ensuring no matches
    for (let row = 0; row < this.GRID_SIZE; row++) {
      for (let col = 0; col < this.GRID_SIZE; col++) {
        // Get colors we can't use to avoid matches
        const invalidColors = this.getInvalidColors(grid, row, col);
        
        // Filter available colors
        const availableColors = this.matchColors.filter(color => 
          !invalidColors.includes(color)
        );
        
        // Choose a random color from available ones
        const randomIndex = Math.floor(Math.random() * availableColors.length);
        const selectedColor = availableColors[randomIndex];
        
        // Add the color to our grid
        grid[row][col] = selectedColor;
        
        // Create the piece
        pieces.push({
          id: id,
          row: row,
          col: col,
          color: selectedColor,
          x: this.BOARD_PADDING + col * (this.CELL_SIZE + this.GAP),
          y: this.BOARD_PADDING + row * (this.CELL_SIZE + this.GAP)
        });
        id++;
      }
    }
    
    return pieces;
  }
  
  // Check what colors would create a match at a given position
  getInvalidColors(grid, row, col) {
    const invalidColors = [];
    
    // Check horizontal (need 2 same colored pieces on the left to form a match)
    if (col >= 2) {
      if (grid[row][col-1] === grid[row][col-2]) {
        invalidColors.push(grid[row][col-1]);
      }
    }
    
    // Check vertical (need 2 same colored pieces above to form a match)
    if (row >= 2) {
      if (grid[row-1][col] === grid[row-2][col]) {
        invalidColors.push(grid[row-1][col]);
      }
    }
    
    return invalidColors;
  }
  
  // Check for matches in the current board configuration
  checkForMatches() {
    try {
      console.log("Checking for matches...");
      
      const { pieces } = this.state;
      if (!pieces || pieces.length === 0) {
        console.log("No pieces to check for matches");
        return;
      }
      
      const grid = this.GRID_SIZE;
      const matches = [];
    
    // Helper method to get a piece at a specific row/col
    const getPieceAt = (row, col) => {
      return pieces.find(p => p.row === row && p.col === col);
    };
    
    // Check for horizontal matches (rows)
    for (let row = 0; row < grid; row++) {
      let currentColor = null;
      let matchLength = 1;
      
      for (let col = 0; col < grid; col++) {
        const piece = getPieceAt(row, col);
        
        if (piece && currentColor === piece.color) {
          // Continue the current match
          matchLength++;
        } else {
          // End of current match or different color
          if (matchLength >= 3) {
            // We found a match of at least 3
            const match = [];
            for (let i = col - matchLength; i < col; i++) {
              match.push(getPieceAt(row, i));
            }
            matches.push(match);
          }
          
          // Start a new potential match
          currentColor = piece ? piece.color : null;
          matchLength = 1;
        }
      }
      
      // Check if there's a match at the end of the row
      if (matchLength >= 3) {
        const match = [];
        for (let i = grid - matchLength; i < grid; i++) {
          match.push(getPieceAt(row, i));
        }
        matches.push(match);
      }
    }
    
    // Check for vertical matches (columns)
    for (let col = 0; col < grid; col++) {
      let currentColor = null;
      let matchLength = 1;
      
      for (let row = 0; row < grid; row++) {
        const piece = getPieceAt(row, col);
        
        if (piece && currentColor === piece.color) {
          // Continue the current match
          matchLength++;
        } else {
          // End of current match or different color
          if (matchLength >= 3) {
            // We found a match of at least 3
            const match = [];
            for (let i = row - matchLength; i < row; i++) {
              match.push(getPieceAt(i, col));
            }
            matches.push(match);
          }
          
          // Start a new potential match
          currentColor = piece ? piece.color : null;
          matchLength = 1;
        }
      }
      
      // Check if there's a match at the end of the column
      if (matchLength >= 3) {
        const match = [];
        for (let i = grid - matchLength; i < grid; i++) {
          match.push(getPieceAt(i, col));
        }
        matches.push(match);
      }
    }
    
    // Now process any matches that were found
    if (matches.length > 0) {
      console.log(`Found ${matches.length} matches!`);
      
      // For now, just highlight the matched pieces
      const matchedPieceIds = new Set();
      
      matches.forEach(match => {
        match.forEach(piece => {
          if (piece) {
            matchedPieceIds.add(piece.id);
          }
        });
      });
      
      // First, just highlight the matched pieces
      const highlightedPieces = pieces.map(piece => {
        if (matchedPieceIds.has(piece.id)) {
          return { ...piece, matched: true };
        }
        return piece;
      });
      
      // Update state with the highlighted matches first
      this.setState({ 
        pieces: highlightedPieces,
        score: this.state.score + (matchedPieceIds.size * 10) // Simple scoring
      });
      
      // Update the score in Redux
      if (this.props.updateScore) {
        this.props.updateScore(this.state.score + (matchedPieceIds.size * 10));
      }
      
      console.log(`Added ${matchedPieceIds.size * 10} points to score.`);
      
      // After a short delay, remove the matched pieces and apply gravity
      setTimeout(() => {
        this.removeMatchedPieces(matchedPieceIds);
      }, 500);
    } else {
      console.log("No matches found.");
    }
    
    } catch (error) {
      console.error("Error in checkForMatches:", error);
    }
  }
  
  // Animate pieces moving to their new positions
  animatePiecesMovement(pieces) {
    // Clear the matched flag from all pieces
    pieces.forEach(piece => {
      piece.matched = false;
    });
    
    // Create temporary animations for all pieces
    const animations = [];
    
    pieces.forEach(piece => {
      try {
        // For existing pieces that moved
        if (this.pans[piece.id]) {
          // Safely get the current position
          let currentPosition = { x: 0, y: 0 };
          try {
            currentPosition = this.pans[piece.id].__getValue();
          } catch (e) {
            console.log(`Error getting position for piece ${piece.id}:`, e);
            // Create a new pan if there was an error
            this.pans[piece.id] = new Animated.ValueXY();
          }
          
          // If they're not at 0,0, animate them back
          if (currentPosition.x !== 0 || currentPosition.y !== 0) {
            animations.push(
              Animated.spring(this.pans[piece.id], {
                toValue: { x: 0, y: 0 },
                friction: 7,
                tension: 60,
                useNativeDriver: false
              })
            );
          }
        } else {
          // New piece, create the pan handler
          this.pans[piece.id] = new Animated.ValueXY();
          
          // Start off-screen (above the board)
          // Small random x offset for more natural movement
          const randomXOffset = (Math.random() * 20) - 10; // -10 to +10
          
          try {
            this.pans[piece.id].setValue({
              x: randomXOffset,
              y: -150 - (piece.row * 20) // Stagger based on row position
            });
            
            // Animate to the correct position with a delay based on row
            const delay = Math.min(piece.row, 7) * 50; // Earlier rows (higher up) start later, cap at 350ms
            
            animations.push(
              Animated.sequence([
                Animated.delay(delay),
                Animated.spring(this.pans[piece.id], {
                  toValue: { x: 0, y: 0 },
                  friction: 6,
                  tension: 50,
                  useNativeDriver: false
                })
              ])
            );
          } catch (e) {
            console.log(`Error animating new piece ${piece.id}:`, e);
          }
        }
      } catch (e) {
        console.log(`Error handling piece ${piece.id}:`, e);
      }
    });
    
    // If there are no animations, just recreate the pan responders
    if (animations.length === 0) {
      this.createPanResponders();
      // Check for any new matches
      this.checkForMatches();
      return;
    }
    
    // Run all animations in parallel
    Animated.parallel(animations).start(() => {
      // When all animations complete, recreate pan responders
      this.createPanResponders();
      
      // Check for any new matches after pieces have settled, with slight delay
      setTimeout(() => {
        this.checkForMatches();
      }, 300);
    });
  }
  
  // Remove matched pieces and apply gravity
  removeMatchedPieces(matchedPieceIds) {
    try {
      console.log("Removing matched pieces and applying gravity...");
      
      if (!matchedPieceIds || matchedPieceIds.size === 0) {
        console.log("No matched pieces to remove");
        return;
      }
      
      const { pieces } = this.state;
      if (!pieces || pieces.length === 0) {
        console.log("No pieces to process");
        return;
      }
    
    // Step 1: Create a 2D grid from our current pieces
    const grid = Array(this.GRID_SIZE).fill().map(() => Array(this.GRID_SIZE).fill(null));
    
    // Place pieces in the grid except for matched ones (which we'll remove)
    pieces.forEach(piece => {
      if (!matchedPieceIds.has(piece.id)) {
        grid[piece.row][piece.col] = piece;
      }
    });
    
    // Step 2: Apply gravity - move pieces down to fill empty spaces
    const updatedPieces = [];
    
    // Process the grid column by column
    for (let col = 0; col < this.GRID_SIZE; col++) {
      let emptyRow = this.GRID_SIZE - 1; // Start from the bottom
      
      // Move from bottom to top in each column
      for (let row = this.GRID_SIZE - 1; row >= 0; row--) {
        const piece = grid[row][col];
        
        if (piece) {
          // If there's a piece, move it to the lowest empty position
          if (row !== emptyRow) {
            // Update piece position
            piece.row = emptyRow;
            piece.y = this.BOARD_PADDING + emptyRow * (this.CELL_SIZE + this.GAP);
          }
          
          updatedPieces.push(piece);
          emptyRow--; // Next empty row is above this one
        }
      }
      
      // Step 3: Fill empty spaces at the top with new pieces
      for (let row = emptyRow; row >= 0; row--) {
        // Create a new piece at this position
        const randomColorIndex = Math.floor(Math.random() * this.matchColors.length);
        const newPiece = {
          id: Date.now() + Math.floor(Math.random() * 10000) + row + col, // Generate unique ID
          row: row,
          col: col,
          color: this.matchColors[randomColorIndex],
          x: this.BOARD_PADDING + col * (this.CELL_SIZE + this.GAP),
          y: this.BOARD_PADDING + row * (this.CELL_SIZE + this.GAP)
        };
        
        updatedPieces.push(newPiece);
      }
    }
    
    // Step 4: Update the state with new pieces
    this.setState({
      pieces: updatedPieces
    }, () => {
      // Step 5: Animate pieces to their new positions
      this.animatePiecesMovement(updatedPieces);
    });
    
    } catch (error) {
      console.error("Error in removeMatchedPieces:", error);
    }
  }
  
  render() {
    try {
      const { draggedPieceId, exchangePieceId } = this.state;
      
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Match 3 Drag and Drop</Text>
          
          <View style={styles.scoreBoard}>
            <Text style={styles.scoreText}>Moves: {this.state.moves}</Text>
            <Text style={styles.scoreText}>Score: {this.state.score}</Text>
          </View>
          
          <View style={styles.board}>
            {this.state.pieces.map(piece => {
              // Handle each piece rendering in a try-catch to prevent entire board from failing
              try {
                if (!piece || !piece.id) return null;
                
                // Check if the pan responder exists
                if (!this.pans[piece.id]) {
                  this.pans[piece.id] = new Animated.ValueXY();
                }
                
                // Check if the panHandler exists
                if (!this.panResponders[piece.id]) {
                  return (
                    <View
                      key={piece.id}
                      style={[
                        styles.piece,
                        {
                          backgroundColor: piece.color,
                          left: piece.x,
                          top: piece.y,
                          zIndex: 1,
                        }
                      ]}
                    />
                  );
                }
                
                return (
                  <Animated.View
                    key={piece.id}
                    style={[
                      styles.piece,
                      {
                        backgroundColor: piece.color,
                        left: Animated.add(piece.x, this.pans[piece.id].x),
                        top: Animated.add(piece.y, this.pans[piece.id].y),
                        zIndex: draggedPieceId === piece.id ? 1000 : 
                                 exchangePieceId === piece.id ? 500 : 
                                 piece.matched ? 100 : 
                                 1,
                        borderWidth: draggedPieceId === piece.id ? 2 : 0,
                        borderColor: draggedPieceId === piece.id ? 'white' : 'transparent',
                        opacity: exchangePieceId === piece.id ? 0.8 : 1,
                        // Add a visual indicator for matched pieces
                        transform: piece.matched ? [{ scale: 0.9 }] : [],
                        shadowColor: piece.matched ? '#FFF' : 'transparent',
                        shadowOpacity: piece.matched ? 0.8 : 0,
                        shadowRadius: piece.matched ? 5 : 0,
                        elevation: piece.matched ? 5 : 0,
                      }
                    ]}
                    {...this.panResponders[piece.id].panHandlers}
                  />
                );
              } catch (e) {
                console.error(`Error rendering piece ${piece?.id}:`, e);
                return null; // Skip rendering this piece
              }
            })}
          </View>
        </View>
      );
    } catch (error) {
      console.error("Error in render:", error);
      // Fallback minimal render
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Match 3 Drag and Drop</Text>
          <Text style={{color: 'red'}}>Error rendering game board</Text>
        </View>
      );
    }
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
    marginBottom: 20,
    color: 'white',
  },
  scoreBoard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    marginBottom: 20,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  board: {
    width: 340,
    height: 340,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 10,
    position: 'relative',
  },
  piece: {
    width: 36, // Adjusted to match CELL_SIZE
    height: 36, // Adjusted to match CELL_SIZE
    borderRadius: 18, // Half of width/height
    position: 'absolute',
  }
});