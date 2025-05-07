/**
 * Drag and Drop Example Component
 * 
 * This is a standalone example of React Native drag and drop functionality.
 * It creates a 5x5 grid of colored circles that can be dragged and dropped
 * to swap positions. Key features:
 * 
 * - Uses React Native's PanResponder for gesture handling
 * - Individual PanResponder for each draggable item
 * - Visual feedback during drag (white border)
 * - Visual feedback for potential drop targets (50% opacity)
 * - Items return to original position if dropped with no valid target
 * - Clean drag and drop interaction with minimal code
 * 
 * This component can be used as a reference or starting point for building
 * drag and drop interfaces in other parts of the application.
 */

import React, { Component } from 'react';
import { View, Text, StyleSheet, PanResponder, Animated } from 'react-native';

export default class DragAndDropExample extends Component {
  constructor(props) {
    super(props);
    
    // Configuration constants
    this.GRID_SIZE = 5;
    this.CELL_SIZE = 60;
    this.GAP = 4;
    this.BOARD_PADDING = 10;
    
    // Generate a 5x5 grid of pieces
    const pieces = [];
    const colors = [
      '#FF5252', '#FF7F50', '#FFEB3B', '#66BB6A', '#42A5F5', 
      '#5E35B1', '#EC407A', '#78909C', '#BA68C8', '#4DB6AC',
      '#FFD54F', '#AED581', '#4FC3F7', '#9575CD', '#F06292',
      '#7986CB', '#FFB74D', '#4DD0E1', '#81C784', '#DCE775',
      '#A1887F', '#90A4AE', '#E57373', '#FF8A65', '#FFF176'
    ];
    
    let id = 1;
    for (let row = 0; row < this.GRID_SIZE; row++) {
      for (let col = 0; col < this.GRID_SIZE; col++) {
        pieces.push({
          id: id,
          color: colors[id - 1], 
          x: this.BOARD_PADDING + col * (this.CELL_SIZE + this.GAP),
          y: this.BOARD_PADDING + row * (this.CELL_SIZE + this.GAP)
        });
        id++;
      }
    }
    
    this.state = {
      pieces,
      draggedPieceId: null,
      exchangePieceId: null
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
    piece1.x = piece2.x;
    piece1.y = piece2.y;
    piece2.x = tempX;
    piece2.y = tempY;
    
    // Reset the animated values
    this.pans[id1].setValue({ x: 0, y: 0 });
    this.pans[id2].setValue({ x: 0, y: 0 });
    
    // Update state
    this.setState({ pieces });
  }
  
  render() {
    const { draggedPieceId, exchangePieceId } = this.state;
    
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Drag and Drop Example</Text>
        
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
                  borderWidth: draggedPieceId === piece.id ? 2 : 0,
                  borderColor: draggedPieceId === piece.id ? 'white' : 'transparent',
                  opacity: exchangePieceId === piece.id ? 0.5 : 1,
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
  board: {
    width: 340,
    height: 340,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 10,
    position: 'relative',
  },
  piece: {
    width: 60,
    height: 60,
    borderRadius: 30,
    position: 'absolute',
  }
});