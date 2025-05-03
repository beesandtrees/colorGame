import React, { Component } from 'react';
import { View, StyleSheet, PanResponder, Animated } from 'react-native';
import Block from '../Block/Block.js';

import * as flowHelpers from '../../helpers/flowMode.js';

export default class FlowBoard extends Component {
  // Class properties
  swipeData = {
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
    rowIndex: -1,
    colIndex: -1
  };
  
  gameTimer = null;
  isSwipeInProgress = false;
  
  constructor(props) {
    super(props);
    this.state = {
      level: props.level || {},
      lastMatchTime: Date.now()
    };
    this.animatedValue = new Animated.Value(0);
    
    // Initialize panResponder in constructor to avoid undefined error
    this.panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt, gestureState) => {
        const { locationX, locationY } = evt.nativeEvent;
        
        // Calculate which block was touched
        const blockSize = this.calculateBlockSize();
        const rowIndex = Math.floor(locationY / blockSize);
        const colIndex = Math.floor(locationX / blockSize);
        
        // Log the touch for debugging
        console.log(`Touch detected at row: ${rowIndex}, col: ${colIndex}`);
        
        // Store starting position
        this.swipeData = {
          startX: locationX,
          startY: locationY,
          endX: locationX,
          endY: locationY,
          rowIndex,
          colIndex
        };
      },
      onPanResponderMove: (evt, gestureState) => {
        // Update end position
        this.swipeData.endX = this.swipeData.startX + gestureState.dx;
        this.swipeData.endY = this.swipeData.startY + gestureState.dy;
      },
      onPanResponderRelease: () => {
        this.handleSwipeComplete();
      }
    });
  }
  
  componentDidMount() {
    // Initialize the game grid
    const grid = flowHelpers.populateFlowGrid(
      this.props.numberofrows,
      this.props.numberofcolors
    );
    this.props.createGrid(grid);
    
    // Render the blocks
    this.renderBlocks(
      grid,
      this.props.numberofrows,
      this.props.colors
    );
    
    // DO NOT start the game loop - this is causing the flashing
    // We'll let the player control everything with swipes instead
    // this.startGameLoop();
    
    console.log("Flow Mode initialized - swipe to play!");
  }
  
  componentWillUnmount() {
    // Clear the game timer
    if (this.gameTimer) {
      clearInterval(this.gameTimer);
    }
  }
  
  UNSAFE_componentWillReceiveProps(nextProps) {
    if (this.props.grid !== nextProps.grid) {
      this.renderBlocks(
        nextProps.grid,
        nextProps.numberofrows,
        nextProps.colors
      );
    }
  }
  
  startGameLoop() {
    const { speed } = this.props.level;
    
    console.log(`Starting game loop with speed: ${speed}ms`);
    
    // Clear any existing timer
    if (this.gameTimer) {
      clearInterval(this.gameTimer);
    }
    
    // Use a much slower update rate to prevent flashing
    // But not too slow, or it won't feel like the game is progressing
    const updateRate = Math.max(500, speed);
    
    this.gameTimer = setInterval(() => {
      // Move blocks down
      this.updateGameState();
    }, updateRate);
  }
  
  updateGameState() {
    const { grid } = this.props.game;
    const { numberofrows } = this.props;
    
    // Use Animated API for smoother transitions
    Animated.timing(this.animatedValue, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true
    }).start(() => {
      // Reset animation value
      this.animatedValue.setValue(0);
      
      // Shift blocks down
      const newGrid = flowHelpers.shiftBlocksDown(
        grid, 
        numberofrows, 
        numberofrows
      );
      
      // Check for matches
      const matches = flowHelpers.checkMatches(
        newGrid, 
        numberofrows, 
        numberofrows
      );
      
      // If there are matches, remove them and update score
      if (matches.length > 0) {
        const updatedGrid = flowHelpers.removeMatches(
          newGrid, 
          matches, 
          numberofrows, 
          numberofrows
        );
        
        const scoreGain = flowHelpers.calculateScore(matches);
        const newScore = this.props.game.score + scoreGain;
        
        this.props.updateScore(newScore);
        this.props.createGrid(updatedGrid);
      } else {
        this.props.createGrid(newGrid);
      }
      
      // Check if game is over
      if (flowHelpers.checkGameOver(newGrid, numberofrows)) {
        clearInterval(this.gameTimer);
        this.props.didWin(false);
      }
    });
  }
  
  calculateBlockSize() {
    // Calculate block size based on board dimensions
    // Safe fallback in case this is called before props are available
    return this.props && this.props.numberofrows 
      ? (100 / this.props.numberofrows)
      : 10; // Default fallback size
  }
  
  handleSwipeComplete() {
    // If a swipe is already being processed, return
    if (this.isSwipeInProgress) {
      return;
    }
    
    // Set the flag to indicate we're processing a swipe
    this.isSwipeInProgress = true;
    
    const { startX, startY, endX, endY, rowIndex, colIndex } = this.swipeData;
    const { grid } = this.props.game;
    const { numberofrows } = this.props;
    
    // Calculate direction of swipe
    const dx = endX - startX;
    const dy = endY - startY;
    
    // Determine if horizontal or vertical swipe
    let direction;
    if (Math.abs(dx) > Math.abs(dy)) {
      direction = dx > 0 ? 'right' : 'left';
    } else {
      direction = dy > 0 ? 'down' : 'up';
    }
    
    // Display visual feedback about what's being swiped
    console.log(`Swiping ${direction} at row: ${rowIndex}, col: ${colIndex}`);
    
    // Validate swipe (ensure within bounds and minimum distance)
    const minSwipeDistance = 20; // Increased to make it less sensitive
    if (
      rowIndex >= 0 && 
      rowIndex < numberofrows && 
      colIndex >= 0 && 
      colIndex < numberofrows &&
      (Math.abs(dx) > minSwipeDistance || Math.abs(dy) > minSwipeDistance)
    ) {
      // Use animation for smooth transition
      Animated.timing(this.animatedValue, {
        toValue: 0.5,
        duration: 200,
        useNativeDriver: true
      }).start(() => {
        // Process the swipe - swapping blocks based on direction
        console.log("Processing swipe");
        
        const newGrid = flowHelpers.handleSwipe(
          direction,
          rowIndex,
          colIndex,
          grid,
          numberofrows,
          numberofrows
        );
        
        // Check for matches after swipe
        const matches = flowHelpers.checkMatches(
          newGrid, 
          numberofrows, 
          numberofrows
        );
        
        console.log(`Found ${matches.length} matches`);
        
        if (matches.length > 0) {
          // If there are matches, remove them
          const updatedGrid = flowHelpers.removeMatches(
            newGrid,
            matches,
            numberofrows,
            numberofrows
          );
          
          // Update score
          const scoreGain = flowHelpers.calculateScore(matches);
          const newScore = this.props.game.score + scoreGain;
          
          // Give more obvious feedback about the score
          console.log(`Score increase: +${scoreGain}`);
          
          this.props.updateScore(newScore);
          this.props.createGrid(updatedGrid);
          
          // Check if level up is needed (every 100 points)
          const currentLevel = this.props.game.level;
          const newLevel = Math.floor(newScore / 100) + 1;
          
          if (newLevel > currentLevel) {
            console.log(`Leveling up to ${newLevel}!`);
            this.props.updateLevel(newLevel);
            
            // Restart the game loop with the new level settings
            setTimeout(() => {
              const level = flowHelpers.createFlowLevel(newLevel);
              this.setState({ level }, () => {
                this.startGameLoop();
              });
            }, 500);
          }
          
          // Show success animation?
          // We could add a flash of color or particle effect here
        } else {
          this.props.createGrid(newGrid);
        }
        
        // Complete the animation and release the lock
        Animated.timing(this.animatedValue, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true
        }).start(() => {
          // Reset the flag after a short delay to prevent rapid swipes
          setTimeout(() => {
            this.isSwipeInProgress = false;
          }, 100);
        });
      });
    } else {
      // If the swipe was invalid, immediately release the lock
      this.isSwipeInProgress = false;
    }
  }
  
  renderBlocks(grid, rows, colors) {
    let blocks = [];
    
    // Create the block components
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < rows; j++) {
        // Get the color from the current grid block
        const cell = grid[i][j];
        
        let backgroundColor, borderColor;
        
        // Handle empty cells and cells with valid colors
        if (cell.color === -1 || cell.color === undefined) {
          // For empty cells, use a transparent block
          blocks.push(
            <View
              key={`row${i}col${j}`}
              style={[
                styles.emptyBlock,
                { width: `${100 / rows}%`, height: `${100 / rows}%` }
              ]}
            />
          );
          continue;
        } else if (cell.color >= 0 && cell.color < colors.length) {
          // Normal case - valid color index
          backgroundColor = colors[cell.color].backgroundColor;
          borderColor = cell.active ? 'white' : colors[cell.color].borderColor;
        } else {
          // Fallback for invalid color indices
          console.log(`Warning: Invalid color index ${cell.color} at [${i},${j}]`);
          backgroundColor = '#ccc';
          borderColor = '#999';
        }
        
        // Add block component to the array
        blocks.push(
          <Block
            key={`row${i}col${j}`}
            xcoord={i}
            ycoord={j}
            cols={rows}
            bgcolor={backgroundColor}
            border={borderColor}
            // Disable click handling in flow mode - we use swipes instead
            clickbox={() => {}}
          />
        );
      }
    }
    
    this.props.loadBlocks(blocks);
  }
  
  render() {
    const hasWon = this.props.game.hasWon;
    
    // Create animation style for smooth transitions
    const animatedStyle = {
      opacity: this.animatedValue.interpolate({
        inputRange: [0, 0.1, 0.9, 1],
        outputRange: [1, 0.98, 0.98, 1]
      }),
      transform: [
        {
          translateY: this.animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 2]
          })
        }
      ]
    };
    
    // Only spread panHandlers if it exists
    const panHandlersProps = this.panResponder ? this.panResponder.panHandlers : {};
    
    return (
      <Animated.View 
        style={[
          styles.gameBoard, 
          hasWon === false ? styles.gameOver : null,
          animatedStyle
        ]}
        {...panHandlersProps}
      >
        <View style={styles.game}>
          {this.props.game.blocks}
        </View>
      </Animated.View>
    );
  }
}

const styles = StyleSheet.create({
  gameBoard: {
    width: '100%',
    alignSelf: 'center',
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  game: {
    width: '100%',
    aspectRatio: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gameOver: {
    opacity: 0.5,
  },
  emptyBlock: {
    backgroundColor: 'transparent',
  }
});