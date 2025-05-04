import React, { Component } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, Text } from 'react-native';
import * as match3Helpers from '../../helpers/match3Mode.js';
import { MATCH3_MODE } from '../../helpers/constants.js';

export default class Match3Board extends Component {
  // Class properties
  firstSelectedBlock = null;
  
  constructor(props) {
    super(props);
    this.state = {
      level: props.level || {},
      moves: 0,
      gameOver: false,
      animationPhase: 'idle',
      cascadeCount: 0,
      matchesMade: 0,
      levelCompleted: false
    };
    
    // No touch tracking needed - using simplified tap-based swapping
  }

  // Check if position is within grid bounds
  isValidPosition(row, col) {
    const rows = this.props.numberofrows;
    return row >= 0 && row < rows && col >= 0 && col < rows;
  }

  // Process the swap between two blocks
  // Process matches found after a move
  processMatchesFound(matches, newGrid) {
    console.log("Processing matches - with visual steps");
    
    // Calculate score with level multiplier
    const scoreGain = match3Helpers.calculateScore(matches, 1.0, this.props.game.level);
    const newScore = this.props.game.score + scoreGain;
    console.log(`Score increased by ${scoreGain} to ${newScore} (level ${this.props.game.level})`);
    this.props.updateScore(newScore);
    
    // Update matchesMade counter (both in local state and Redux)
    const newMatchesMade = this.state.matchesMade + matches.length;
    console.log(`Before update - Local matches: ${this.state.matchesMade}, Redux matches: ${this.props.game.matchesMade}`);
    this.setState({ matchesMade: newMatchesMade });
    if (this.props.updateMatchesMade) {
      console.log(`Updating Redux with ${newMatchesMade} matches`);
      this.props.updateMatchesMade(newMatchesMade);
    } else {
      console.error('updateMatchesMade is undefined');
    }
    console.log(`Made ${matches.length} matches. Total: ${newMatchesMade}/${this.props.level.matchGoal}`);
    
    // STEP 1: First highlight the matched blocks
    const highlightedGrid = JSON.parse(JSON.stringify(newGrid)); // Deep clone to avoid reference issues
    
    // Mark the matched blocks
    matches.forEach(match => {
      match.forEach(pos => {
        if (highlightedGrid[pos.row] && highlightedGrid[pos.row][pos.col]) {
          highlightedGrid[pos.row][pos.col].matched = true;
        }
      });
    });
    
    // Update grid to show highlighted matches
    this.props.createGrid(highlightedGrid);
    
    // STEP 2: After delay, remove matched blocks and replace with white
    setTimeout(() => {
      console.log("STEP 2: Removing matched blocks");
      const removedGrid = JSON.parse(JSON.stringify(highlightedGrid));
      
      // Remove matched blocks and replace with white spaces
      matches.forEach(match => {
        match.forEach(pos => {
          if (removedGrid[pos.row] && removedGrid[pos.row][pos.col]) {
            // Replace with white empty block
            removedGrid[pos.row][pos.col] = {
              color: -1,
              isEmpty: true,
              isWhiteSpace: true // Special flag for rendering as white
            };
          }
        });
      });
      
      // Update grid to show white spaces
      this.props.createGrid(removedGrid);
      
      // STEP 3: After another delay, apply gravity and add new blocks
      setTimeout(() => {
        console.log("STEP 3: Applying gravity");
        
        // Create a new grid for the final state
        const gravityGrid = JSON.parse(JSON.stringify(removedGrid));
        const numberofrows = this.props.numberofrows;
        
        // Apply gravity - shift blocks down to fill empty spaces
        for (let col = 0; col < numberofrows; col++) {
          // Collect all non-empty blocks in the column
          const colBlocks = [];
          for (let row = 0; row < numberofrows; row++) {
            if (!gravityGrid[row][col].isEmpty && gravityGrid[row][col].color !== -1) {
              colBlocks.push(gravityGrid[row][col]);
            }
          }
          
          // Fill from bottom up
          for (let row = numberofrows - 1; row >= 0; row--) {
            if (colBlocks.length > 0) {
              // Place a block from our collection
              gravityGrid[row][col] = colBlocks.pop();
            } else {
              // No more blocks, fill with empty
              gravityGrid[row][col] = {
                color: -1,
                isEmpty: true
              };
            }
          }
        }
        
        // Show the blocks after gravity is applied
        this.props.createGrid(gravityGrid);
        
        // STEP 4: After delay, add new blocks
        setTimeout(() => {
          console.log("STEP 4: Adding new blocks");
          
          // Create a grid with new blocks
          const finalGrid = JSON.parse(JSON.stringify(gravityGrid));
          
          // Add new blocks at the top where empty
          for (let row = 0; row < numberofrows; row++) {
            for (let col = 0; col < numberofrows; col++) {
              if (finalGrid[row][col].isEmpty || finalGrid[row][col].color === -1) {
                // Create a new random block
                finalGrid[row][col] = {
                  color: Math.floor(Math.random() * this.props.numberofcolors),
                  isNew: true
                };
              }
            }
          }
          
          // Update the grid with final state
          this.props.createGrid(finalGrid);
          
          // STEP 5: Check for cascade matches
          setTimeout(() => {
            console.log("STEP 5: Checking for cascade matches");
            
            const cascadeMatches = match3Helpers.checkMatches(
              finalGrid,
              numberofrows,
              numberofrows
            );
            
            if (cascadeMatches.length > 0) {
              console.log(`Found ${cascadeMatches.length} cascade matches`);
              
              // Process cascade matches
              this.processCascadeMatches(finalGrid, newScore);
            } else {
              // No cascade matches, so we can check for level completion
              if (this.state.matchesMade >= this.props.level.matchGoal && !this.state.levelCompleted) {
                console.log("No cascade matches. Checking level completion.");
                this.setState({ levelCompleted: true }, () => {
                  // Wait a bit before showing completion
                  setTimeout(() => {
                    this.handleLevelComplete();
                  }, styles.delayMedium);
                });
              }
            }
          }, styles.delayShort);
          
        }, styles.delayMedium); // Delay before adding new blocks
        
      }, styles.delayMedium); // Delay before applying gravity
      
    }, styles.delayShort); // Delay before removing matched blocks
  }

  processSwap(row1, col1, row2, col2) {
    // Check if blocks are adjacent
    if (!match3Helpers.areAdjacent(row1, col1, row2, col2)) {
      console.log("Blocks are not adjacent, ignoring swap");
      return;
    }

    console.log(`Processing swap between [${row1},${col1}] and [${row2},${col2}]`);
    
    const { grid } = this.props.game;
    const { numberofrows } = this.props;
    
    // Clone the grid - use direct copy for React Native/Hermes compatibility
    let newGrid = grid.map(row => [...row]);
    
    // Swap the blocks
    newGrid = match3Helpers.swapBlocks(
      newGrid,
      row1, col1,
      row2, col2
    );
    
    // Increment move counter
    const newMoves = this.state.moves + 1;
    this.setState({ moves: newMoves });
    
    // Update the clicks in Redux (for moves limit display)
    this.props.updateClicks(newMoves);
    
    // Check for matches
    const matches = match3Helpers.checkMatches(
      newGrid,
      numberofrows,
      numberofrows
    );
    
    console.log(`Found ${matches.length} matches after swap`);
    
    if (matches.length > 0) {
      // Process matches using our unified method
      this.processMatchesFound(matches, newGrid);
    } else {
      // If no matches after swap, swap blocks back
      console.log("No matches found, swapping back");
      
      newGrid = match3Helpers.swapBlocks(
        newGrid,
        row2, col2,
        row1, col1
      );
      this.props.createGrid(newGrid);
    }
    
    // Check if game is over (reached move limit)
    if (this.state.moves >= this.props.level.moveLimit) {
      this.setState({ gameOver: true });
      this.props.didWin(false);
      
      // Show game over alert
      Alert.alert(
        "Level Failed",
        `You've used all ${this.props.level.moveLimit} moves!\nYou made ${this.state.matchesMade}/${this.props.level.matchGoal} matches.\nFinal Score: ${this.props.game.score}`,
        [
          { 
            text: "Try Again", 
            onPress: () => {
              if (this.props.restart) {
                this.props.restart(true);
                // We must reinitialize the game state after the restart completes
                setTimeout(() => {
                  this.initializeGame();
                }, styles.delayShort);
              }
            }
          }
        ]
      );
    }
  }
  
  componentDidMount() {
    // Initialize the game grid
    this.initializeGame();
    console.log("Match 3 Mode initialized - tap blocks to swap!");
  }
  
  // Separate initialization function that can be reused
  initializeGame() {
    // Reset game state
    this.setState({
      moves: 0,
      gameOver: false,
      potentialMatches: [], // Track potential matches
      animationPhase: 'idle', // Track current animation phase
      cascadeCount: 0, // Reset cascade counter
      matchesMade: 0, // Reset match counter for level progression
      levelCompleted: false // Reset level completion flag
    });
    
    // Reset matchesMade in Redux (with null check)
    if (this.props.updateMatchesMade) {
      console.log("Resetting match counter to 0");
      this.props.updateMatchesMade(0);
    }
    
    this.firstSelectedBlock = null;
    
    // Initialize the game grid
    const grid = match3Helpers.generateMatch3Grid(
      this.props.numberofrows,
      this.props.numberofcolors
    );
    
    this.props.createGrid(grid);
    
    // Check for potential matches
    const potentialMatches = match3Helpers.checkPotentialMatches(
      grid,
      this.props.numberofrows,
      this.props.numberofrows
    );
    console.log(`Found ${potentialMatches.length} potential matches on the board`);
    
    // Store potential matches
    this.setState({ potentialMatches });
    
    // Render the blocks
    this.renderBlocks(
      grid,
      this.props.numberofrows,
      this.props.colors
    );
  }
  
  // Simplified approach - no more complex swipe detection
  // Just direct handling of block selection and swaps
  handleBlockPress(row, col) {
    console.log(`Block pressed at [${row},${col}]`);
    
    // If game is over, don't allow more moves
    if (this.state.gameOver) {
      console.log("Game is over, ignoring press");
      return;
    }
    
    const { grid } = this.props.game;
    const { numberofrows } = this.props;
    
    // Make sure coordinates are valid
    if (row < 0 || row >= numberofrows || col < 0 || col >= numberofrows) {
      console.log("Invalid coordinates, ignoring press");
      return;
    }
    
    // Clone the grid for updates
    let newGrid = grid.map(row => [...row]);
    
    // If no block is selected yet, select this one
    if (!this.firstSelectedBlock) {
      console.log("First block selected");
      newGrid[row][col].selected = true;
      this.firstSelectedBlock = { row, col };
      this.props.createGrid(newGrid);
      return;
    }
    
    // Get previous selection
    const { row: firstRow, col: firstCol } = this.firstSelectedBlock;
    
    // If the same block is tapped twice, deselect it
    if (firstRow === row && firstCol === col) {
      console.log("Same block tapped twice, deselecting");
      newGrid[row][col].selected = false;
      this.firstSelectedBlock = null;
      this.props.createGrid(newGrid);
      return;
    }
    
    // Check if blocks are adjacent
    const isAdjacent = match3Helpers.areAdjacent(firstRow, firstCol, row, col);
    
    // First, always clear the selection in UI
    newGrid[firstRow][firstCol].selected = false;
    this.props.createGrid(newGrid);
    
    if (isAdjacent) {
      console.log("Adjacent block selected, attempting swap");
      
      // Process the swap
      this.processSwap(firstRow, firstCol, row, col);
      
      // Reset selection state
      this.firstSelectedBlock = null;
    } else {
      console.log("Non-adjacent block selected, changing selection");
      
      // Select the new block instead
      newGrid[row][col].selected = true;
      this.firstSelectedBlock = { row, col };
      this.props.createGrid(newGrid);
    }
  }
  
  componentWillUnmount() {
    // Nothing to clean up now that we've simplified
  }
  
  UNSAFE_componentWillReceiveProps(nextProps) {
    // If the grid changes, re-render blocks
    if (this.props.grid !== nextProps.grid) {
      this.renderBlocks(
        nextProps.grid,
        nextProps.numberofrows,
        nextProps.colors
      );
    }
    
    // If the level changes, reinitialize the game
    if (this.props.game.level !== nextProps.game.level) {
      console.log(`Level changed from ${this.props.game.level} to ${nextProps.game.level}, reinitializing game`);
      setTimeout(() => {
        this.initializeGame();
      }, 300);
    }
  }
  
  // Removed handleBlockTap and replaced with handleBlockPress above
  
  // Handle level completion 
  handleLevelComplete() {
    // Calculate bonus points based on remaining moves and level
    const remainingMoves = this.props.level.moveLimit - this.state.moves;
    const levelMultiplier = Math.pow(MATCH3_MODE.LEVEL_SCORE_MULTIPLIER, this.props.game.level - 1);
    const bonusPoints = Math.floor(remainingMoves * 10 * levelMultiplier); // Scaled by level
    
    // Update score with bonus
    const newScore = this.props.game.score + bonusPoints;
    this.props.updateScore(newScore);
    
    // Set game as won - this triggers the styled WinLose component
    console.log(`Level complete! Bonus: ${bonusPoints} points for ${remainingMoves} remaining moves.`);
    
    // Mark that the player won LAST - this triggers the styled winner component
    this.props.didWin(true);
  }
  
  // Simpler cascade match handler
  processCascadeMatches(grid, currentScore) {
    const numberofrows = this.props.numberofrows;
    
    // Check for matches
    const cascadeMatches = match3Helpers.checkMatches(
      grid,
      numberofrows,
      numberofrows
    );
    
    if (cascadeMatches.length > 0) {
      // Calculate score with cascade and level multipliers
      const scoreGain = match3Helpers.calculateScore(cascadeMatches, 1.5, this.props.game.level);
      const newScore = currentScore + scoreGain;
      this.props.updateScore(newScore);
      
      // Update matchesMade counter for cascade matches too (both in local state and Redux)
      const newMatchesMade = this.state.matchesMade + cascadeMatches.length;
      this.setState({ matchesMade: newMatchesMade });
      if (this.props.updateMatchesMade) {
        this.props.updateMatchesMade(newMatchesMade);
      }
      console.log(`Made ${cascadeMatches.length} cascade matches. Total: ${newMatchesMade}/${this.props.level.matchGoal}`);
      
      // STEP 1: First highlight the cascade matches
      const highlightedGrid = JSON.parse(JSON.stringify(grid)); // Deep clone
      
      // Mark the matched blocks
      cascadeMatches.forEach(match => {
        match.forEach(pos => {
          if (highlightedGrid[pos.row] && highlightedGrid[pos.row][pos.col]) {
            highlightedGrid[pos.row][pos.col].matched = true;
          }
        });
      });
      
      // Update grid to show highlighted matches
      this.props.createGrid(highlightedGrid);
      
      // STEP 2: After delay, remove matched blocks and replace with white
      setTimeout(() => {
        const removedGrid = JSON.parse(JSON.stringify(highlightedGrid));
        
        // Remove matched blocks
        cascadeMatches.forEach(match => {
          match.forEach(pos => {
            if (removedGrid[pos.row] && removedGrid[pos.row][pos.col]) {
              // Replace with white empty block
              removedGrid[pos.row][pos.col] = {
                color: -1,
                isEmpty: true,
                isWhiteSpace: true // Special flag for rendering as white
              };
            }
          });
        });
        
        // Update grid to show white spaces
        this.props.createGrid(removedGrid);
        
        // STEP 3: After another delay, apply gravity and add new blocks
        setTimeout(() => {
          const finalGrid = JSON.parse(JSON.stringify(removedGrid));
          
          // Apply gravity
          for (let col = 0; col < numberofrows; col++) {
            // Collect all non-empty blocks in the column
            const colBlocks = [];
            for (let row = 0; row < numberofrows; row++) {
              if (!finalGrid[row][col].isEmpty && finalGrid[row][col].color !== -1) {
                colBlocks.push(finalGrid[row][col]);
              }
            }
            
            // Fill from bottom up
            for (let row = numberofrows - 1; row >= 0; row--) {
              if (colBlocks.length > 0) {
                // Place a block from our collection
                finalGrid[row][col] = colBlocks.pop();
              } else {
                // No more blocks, fill with empty
                finalGrid[row][col] = {
                  color: -1,
                  isEmpty: true
                };
              }
            }
          }
          
          // Add new blocks at the top
          for (let row = 0; row < numberofrows; row++) {
            for (let col = 0; col < numberofrows; col++) {
              if (finalGrid[row][col].isEmpty || finalGrid[row][col].color === -1) {
                // Create a new random block
                finalGrid[row][col] = {
                  color: Math.floor(Math.random() * this.props.numberofcolors),
                  isNew: true
                };
              }
            }
          }
          
          // Update the grid with the final state
          this.props.createGrid(finalGrid);
          
          // Check for more cascades (limited depth)
          if (this.state.cascadeCount < MATCH3_MODE.MAX_CASCADE_ITERATIONS) {
            this.setState({ cascadeCount: this.state.cascadeCount + 1 });
            
            setTimeout(() => {
              this.processCascadeMatches(finalGrid, newScore);
            }, styles.delayLong);
          } else {
            // Reset cascade counter
            this.setState({ cascadeCount: 0 });
            
            // Now that all cascade processing is done, check for level completion
            if (this.state.matchesMade >= this.props.level.matchGoal && !this.state.levelCompleted) {
              console.log("All cascades completed. Checking level completion.");
              this.setState({ levelCompleted: true }, () => {
                // Wait a bit before showing completion to allow animations to finish
                setTimeout(() => {
                  this.handleLevelComplete();
                }, styles.delayMedium);
              });
            }
          }
        }, styles.delayMedium); // Delay before applying gravity and adding new blocks
      }, styles.delayShort); // Delay before removing matched blocks
    } else {
      // No more cascades, reset counter
      this.setState({ cascadeCount: 0 });
      
      // No cascades, but we still need to check for level completion
      if (this.state.matchesMade >= this.props.level.matchGoal && !this.state.levelCompleted) {
        console.log("No cascades. Checking level completion.");
        this.setState({ levelCompleted: true }, () => {
          // Wait a bit before showing completion
          setTimeout(() => {
            this.handleLevelComplete();
          }, styles.delayMedium);
        });
      }
    }
  }
  
  renderBlocks(grid, rows, colors) {
    let blocks = [];
    
    // Dynamically update the blockSize style
    styles.blockSize = {
      width: `${100 / rows}%`,
      height: `${100 / rows}%`
    };
    
    console.log(`Rendering blocks with ${rows}x${rows} grid, blockSize: ${100/rows}%`);
    
    // Keep consistent padding across all grid sizes for visual consistency
    // Original Block.js uses padding: 2 consistently
    
    // Create the block components
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < rows; j++) {
        // Get the cell from the grid
        const cell = grid[i] && grid[i][j] ? grid[i][j] : null;
        
        if (!cell || cell.color === -1 || cell.isEmpty) {
          blocks.push(
            <View
              key={`row${i}col${j}`}
              style={[
                styles.emptyBlock,
                styles.blockSize,
                cell && cell.isWhiteSpace ? styles.whiteSpace : styles.transparentSpace
              ]}
            />
          );
          continue;
        }
        
        // Get block colors based on cell data
        let backgroundColor, borderColor;
        const cellColor = cell.color;
        
        if (cellColor >= 0 && cellColor < colors.length) {
          backgroundColor = colors[cellColor].backgroundColor;
          borderColor = colors[cellColor].borderColor;
          
          // For selected blocks, use white border
          if (cell.selected) {
            borderColor = '#FFFFFF';
          }
        } else {
          // Fallback for invalid colors
          backgroundColor = '#CCC';
          borderColor = '#999';
        }
        
        // Use block size from styles
        
        // Additional states
        const stateStyles = [];
        
        if (cell.selected) {
          stateStyles.push(styles.selectedBlock);
        }
        
        // Create specialized outer circle style when needed
        let outerCircleStyle = [
          styles.outerCircle,
          { 
            backgroundColor: borderColor,
          }
        ];
        
        // For selected blocks, use a solid white border
        if (cell.selected) {
          borderColor = '#FFFFFF'; // Solid white border
          outerCircleStyle = [
            styles.outerCircle,
            { backgroundColor: '#FFFFFF' } // White border for selected blocks
          ];
        }
        
        // Style for matched blocks
        if (cell.matched) {
          stateStyles.push(styles.matchedBlock);
          // For matched blocks, make both circles same color for solid appearance
          backgroundColor = borderColor;
        }
        
        if (cell.isNew) {
          stateStyles.push(styles.newBlock);
          
          // Reset isNew flag after a timeout
          setTimeout(() => {
            if (cell) {
              cell.isNew = false;
            }
          }, styles.delayShort);
        }
        
        // Render the block with TouchableOpacity for swipe detection
        blocks.push(
          <TouchableOpacity
            key={`row${i}col${j}`}
            style={[
              styles.blockContainer,
              styles.blockSize,
              ...stateStyles
            ]}
            onPress={() => this.handleBlockPress(i, j)}
            activeOpacity={0.7} // Give visual feedback when pressed
            // For clarity and direct navigation
            row={i}
            col={j}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`Color block at row ${i+1}, column ${j+1}`}
          >
            <View 
              style={outerCircleStyle}
            >
              <View 
                style={[
                  styles.innerCircle,
                  { 
                    backgroundColor: backgroundColor,
                    // For matched blocks, make inner circle fill the entire outer circle
                    width: cell.matched ? '100%' : '80%',
                    height: cell.matched ? '100%' : '80%',
                  }
                ]}
              />
            </View>
          </TouchableOpacity>
        );
      }
    }
    
    this.props.loadBlocks(blocks);
  }
  
  render() {
    const hasWon = this.props.game.hasWon;
    
    return (
      <View 
        style={[
          styles.gameBoard, 
          hasWon === false ? styles.gameOver : null
        ]}
      >
        <View style={styles.game}>
          {this.props.game.blocks}
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  // Game board container
  gameBoard: {
    width: '100%',
    alignSelf: 'center',
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  game: {
    width: '100%',
    aspectRatio: 1, // Maintain square aspect ratio
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden', // Ensure blocks are contained within game area
  },
  gameOver: {
    opacity: 0.5,
  },
  
  // Block sizing - for both filled and empty blocks
  blockSize: {
    width: `${100 / 8}%`, // Default for 8x8
    height: `${100 / 8}%`, // Default for 8x8
  },
  
  // Empty spaces
  emptyBlock: {
    backgroundColor: 'transparent',
    borderRadius: 5,
  },
  whiteSpace: {
    backgroundColor: 'rgba(255,255,255,0.6)', // Matched blocks that were removed
  },
  transparentSpace: {
    backgroundColor: 'rgba(255,255,255,0.05)', // Empty spaces with subtle visibility
  },
  
  // Block styling - matched with original Block.js
  blockContainer: {
    padding: 2, // Match original padding
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible', // Ensure we don't clip blocks
  },
  outerCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerCircle: {
    width: '80%', // Match original size
    height: '80%', // Match original size
    borderRadius: 999,
  },
  
  // Block states
  selectedBlock: {
    zIndex: 5, // Just keep the z-index to ensure proper stacking
  },
  // Using background color for borders instead of explicit border
  matchedBlock: {
    // Style for matched blocks - solid color appearance with a slightly reduced scale
    opacity: 1.0, // Full opacity
    transform: [{ scale: 0.85 }], // Slight scale down to show "disappearing" effect
    overflow: 'hidden', // Make sure animation doesn't cause overflow
  },
  newBlock: {
    // No transform - avoid overlapping and stuck states
  },
  
  // Animation delays
  delayShort: 300,
  delayMedium: 400,
  delayLong: 500,
});