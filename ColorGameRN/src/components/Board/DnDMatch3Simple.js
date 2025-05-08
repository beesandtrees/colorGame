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
    
    // Configuration constants
    this.GRID_SIZE = 8; // Increase grid to 8x8
    this.CELL_SIZE = 36; // Smaller cell size to fit the larger grid
    this.GAP = 4;
    this.BOARD_PADDING = 10;
    
    // Generate an 8x8 grid of pieces
    const pieces = [];
    // Define a set of 6 colors for match-3 gameplay
    const matchColors = [
      '#FF5252', // Red
      '#FFEB3B', // Yellow
      '#66BB6A', // Green
      '#42A5F5', // Blue
      '#9575CD', // Purple
      '#FF7F50'  // Orange
    ];
    
    let id = 1;
    for (let row = 0; row < this.GRID_SIZE; row++) {
      for (let col = 0; col < this.GRID_SIZE; col++) {
        // Use a random color from our match-3 colors array
        const randomColorIndex = Math.floor(Math.random() * matchColors.length);
        
        pieces.push({
          id: id,
          row: row,
          col: col,
          color: matchColors[randomColorIndex], 
          x: this.BOARD_PADDING + col * (this.CELL_SIZE + this.GAP),
          y: this.BOARD_PADDING + row * (this.CELL_SIZE + this.GAP)
        });
        id++;
      }
    }
    
    this.state = {
      pieces,
      draggedPieceId: null,
      exchangePieceId: null,
      score: 0,
      moves: 0
    };
    
    // Create pan responders for each piece
    this.pans = {};
    this.panResponders = {};
    
    this.state.pieces.forEach(piece => {
      this.pans[piece.id] = new Animated.ValueXY();
      this.panResponders[piece.id] = PanResponder.create({
        onStartShouldSetPanResponder: () => true,
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
            
            // Increment moves counter
            this.setState(prevState => ({
              moves: prevState.moves + 1
            }));
            
            // Check for matches after swap
            // We'll implement this later
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
    
    // Reset the animated values
    this.pans[id1].setValue({ x: 0, y: 0 });
    this.pans[id2].setValue({ x: 0, y: 0 });
    
    // Update state
    this.setState({ pieces });
    
    // For now, just update the Redux store moves count
    if (this.props.updateClicks) {
      this.props.updateClicks(this.state.moves);
    }
    
    // Check for matches after the swap
    this.checkForMatches();
  }
  
  // Check for matches in the current board configuration
  checkForMatches() {
    console.log("Checking for matches...");
    
    const { pieces } = this.state;
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
      
      // Update the pieces with highlighted matches
      const updatedPieces = pieces.map(piece => {
        if (matchedPieceIds.has(piece.id)) {
          return { ...piece, matched: true };
        }
        return piece;
      });
      
      // Update state with the highlighted matches
      this.setState({ 
        pieces: updatedPieces,
        score: this.state.score + (matchedPieceIds.size * 10) // Simple scoring
      });
      
      // Update the score in Redux
      if (this.props.updateScore) {
        this.props.updateScore(this.state.score + (matchedPieceIds.size * 10));
      }
      
      console.log(`Added ${matchedPieceIds.size * 10} points to score.`);
    } else {
      console.log("No matches found.");
    }
  }
  
  render() {
    const { draggedPieceId, exchangePieceId } = this.state;
    
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Match 3 Drag and Drop</Text>
        
        <View style={styles.scoreBoard}>
          <Text style={styles.scoreText}>Moves: {this.state.moves}</Text>
          <Text style={styles.scoreText}>Score: {this.state.score}</Text>
        </View>
        
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
                  zIndex: draggedPieceId === piece.id ? 10 : (exchangePieceId === piece.id ? 5 : 1),
                  borderWidth: draggedPieceId === piece.id ? 2 : 0,
                  borderColor: draggedPieceId === piece.id ? 'white' : 'transparent',
                  opacity: exchangePieceId === piece.id ? 0.5 : 1,
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
          ))}
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