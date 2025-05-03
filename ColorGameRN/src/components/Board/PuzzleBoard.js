import React, { Component } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, Text } from 'react-native';
import * as puzzleHelpers from '../../helpers/puzzleMode.js';
import { PUZZLE_MODE } from '../../helpers/constants.js';

export default class PuzzleBoard extends Component {
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
  }
  
  componentDidMount() {
    // Initialize the game grid
    this.initializeGame();
    console.log("Puzzle Mode initialized - tap blocks to swap!");
  }
  
  // Separate initialization function that can be reused
  initializeGame() {
    // Reset game state
    this.setState({
      moves: 0,
      gameOver: false,
      potentialMatches: [], // Add this to track potential matches
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
    const grid = puzzleHelpers.generatePuzzleGrid(
      this.props.numberofrows,
      this.props.numberofcolors
    );
    
    this.props.createGrid(grid);
    
    // Check for potential matches
    const potentialMatches = puzzleHelpers.checkPotentialMatches(
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
  
  // No timeout tracking needed with simplified approach
  
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
    
    // TEMPORARILY DISABLE AUTOMATIC REINITIALIZING FOR DEBUGGING
    // This was causing unexpected grid resets
    /*
    // If the level changes, we need to reinitialize the game
    if (this.props.game.level !== nextProps.game.level) {
      console.log(`Level changed from ${this.props.game.level} to ${nextProps.game.level}, reinitializing game`);
      setTimeout(() => {
        this.initializeGame();
      }, 300);
    }
    */
  }
  
  handleBlockTap(row, col) {
    const { grid } = this.props.game;
    const { numberofrows } = this.props;
    
    console.log(`Tapped block at row ${row}, col ${col}`);
    
    // If game is over, don't allow more moves
    if (this.state.gameOver) {
      console.log("Game is over, ignoring tap");
      return;
    }
    
    // Make sure coordinates are valid
    if (row < 0 || row >= numberofrows || col < 0 || col >= numberofrows) {
      console.log("Invalid coordinates, ignoring tap");
      return;
    }
    
    // Clone the grid - use direct copy for React Native/Hermes compatibility
    let newGrid = grid.map(row => [...row]);
    
    // If this is the first block selected
    if (!this.firstSelectedBlock) {
      console.log("First block selected");
      // Mark this block as selected
      newGrid[row][col].selected = true;
      this.firstSelectedBlock = { row, col };
      
      // Update the grid
      this.props.createGrid(newGrid);
      return;
    }
    
    // If this is the second block selected
    const { row: firstRow, col: firstCol } = this.firstSelectedBlock;
    console.log(`Second block selected. Comparing with first block at row ${firstRow}, col ${firstCol}`);
    
    // If the same block is tapped twice, just deselect it
    if (firstRow === row && firstCol === col) {
      console.log("Same block tapped twice, deselecting");
      newGrid[row][col].selected = false;
      this.firstSelectedBlock = null;
      this.props.createGrid(newGrid);
      return;
    }
    
    // Check if the blocks are adjacent
    const isAdjacent = puzzleHelpers.areAdjacent(firstRow, firstCol, row, col);
    
    if (!isAdjacent) {
      console.log("Blocks are not adjacent, selecting new block instead");
      // If they're not adjacent, deselect the first and select the new one
      newGrid[firstRow][firstCol].selected = false;
      newGrid[row][col].selected = true;
      this.firstSelectedBlock = { row, col };
      this.props.createGrid(newGrid);
      return;
    }
    
    // Swap the blocks - this handles deselection too
    newGrid = puzzleHelpers.swapBlocks(
      newGrid,
      firstRow, firstCol,
      row, col
    );
    
    // Clear selection state
    this.firstSelectedBlock = null;
    
    // Increment move counter
    const newMoves = this.state.moves + 1;
    this.setState({ moves: newMoves });
    
    // Update the clicks in Redux (for moves limit display)
    this.props.updateClicks(newMoves);
    
    // Check for matches
    const matches = puzzleHelpers.checkMatches(
      newGrid,
      numberofrows,
      numberofrows
    );
    
    console.log(`Found ${matches.length} matches after swap`);
    
    if (matches.length > 0) {
      console.log("Processing matches - with visual steps");
      
      // Calculate score with level multiplier
      const scoreGain = puzzleHelpers.calculateScore(matches, 1.0, this.props.game.level);
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
      
      // We'll only check level completion after all cascades are processed
      // So we don't do anything here
      
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
              
              const cascadeMatches = puzzleHelpers.checkMatches(
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
    } else {
      // If no matches after swap, swap blocks back
      console.log("No matches found, swapping back");
      
      // If no matches, swap back
      newGrid = puzzleHelpers.swapBlocks(
        newGrid,
        row, col,
        firstRow, firstCol
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
  
  // Handle level completion 
  handleLevelComplete() {
    // Calculate bonus points based on remaining moves and level
    const remainingMoves = this.props.level.moveLimit - this.state.moves;
    const levelMultiplier = Math.pow(PUZZLE_MODE.LEVEL_SCORE_MULTIPLIER, this.props.game.level - 1);
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
    const cascadeMatches = puzzleHelpers.checkMatches(
      grid,
      numberofrows,
      numberofrows
    );
    
    if (cascadeMatches.length > 0) {
      // Calculate score with cascade and level multipliers
      const scoreGain = puzzleHelpers.calculateScore(cascadeMatches, 1.5, this.props.game.level);
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
          if (this.state.cascadeCount < PUZZLE_MODE.MAX_CASCADE_ITERATIONS) {
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
  
  // CASCADE match handler - with delays for visibility
  checkForCascadeMatches(grid, currentScore) {
    console.log("Checking for cascading matches...");
    
    if (!grid) return; // Safeguard against null grid
    
    const numberofrows = this.props.numberofrows;
    
    // Check for matches
    const cascadeMatches = puzzleHelpers.checkMatches(
      grid,
      numberofrows,
      numberofrows
    );
    
    if (cascadeMatches.length > 0) {
      console.log(`Found ${cascadeMatches.length} cascading matches!`);
      
      // Set animation phase to prevent interaction
      this.setState({ animationPhase: 'cascading' });
      
      // Calculate cascade score with multiplier
      const scoreGain = puzzleHelpers.calculateScore(cascadeMatches, 1.5);
      const newScore = currentScore + scoreGain;
      console.log(`Cascade score increased by ${scoreGain} to ${newScore}`);
      this.props.updateScore(newScore);
      
      // STEP 1: First just highlight the cascade matches
      const highlightedGrid = grid.map(row => row ? [...row] : []);
      
      // Mark matched blocks
      cascadeMatches.forEach(match => {
        match.forEach(pos => {
          if (highlightedGrid[pos.row] && highlightedGrid[pos.row][pos.col]) {
            highlightedGrid[pos.row][pos.col].matched = true;
          }
        });
      });
      
      // Show highlighted blocks for a moment
      this.props.createGrid(highlightedGrid);
      
      // STEP 2: After delay, remove the blocks
      this.safeTimeout(() => {
        console.log("CASCADE: Removing matched blocks");
        
        // Create a grid with removed blocks
        const removedGrid = highlightedGrid.map(row => row ? [...row] : []);
        
        // Remove matched blocks
        cascadeMatches.forEach(match => {
          match.forEach(pos => {
            if (removedGrid[pos.row] && removedGrid[pos.row][pos.col]) {
              removedGrid[pos.row][pos.col] = {
                color: -1,
                isEmpty: true,
                matched: false,
                selected: false
              };
            }
          });
        });
        
        // Show the removed blocks
        this.props.createGrid(removedGrid);
        
        // STEP 3: After another delay, apply gravity
        this.safeTimeout(() => {
          console.log("CASCADE: Applying gravity");
          
          // Create grid with blocks moved down
          const gravityGrid = removedGrid.map(row => row ? [...row] : []);
          
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
                  isEmpty: true,
                  selected: false
                };
              }
            }
          }
          
          // Show the blocks after gravity
          this.props.createGrid(gravityGrid);
          
          // STEP 4: After another delay, add new blocks
          this.safeTimeout(() => {
            console.log("CASCADE: Adding new blocks");
            
            // Create a grid with new blocks
            const finalGrid = gravityGrid.map(row => row ? [...row] : []);
            
            // Add new blocks at the top where empty
            for (let row = 0; row < numberofrows; row++) {
              for (let col = 0; col < numberofrows; col++) {
                if (finalGrid[row][col].isEmpty || finalGrid[row][col].color === -1) {
                  // Create a new random block
                  finalGrid[row][col] = {
                    color: Math.floor(Math.random() * this.props.numberofcolors),
                    isNew: true,
                    selected: false,
                    isEmpty: false
                  };
                }
              }
            }
            
            // Show the final grid with new blocks
            this.props.createGrid(finalGrid);
            
            // Trigger animation for new blocks in cascade matches
            this.animateNewBlocks();
            
            // We're done - reset animation state
            this.safeTimeout(() => {
              console.log("CASCADE: Complete");
              this.setState({ 
                animationPhase: 'idle',
                cascadeCount: 0
              });
            }, PUZZLE_MODE.CASCADE_ANIMATION_DELAY); // Final delay before allowing interaction
            
          }, PUZZLE_MODE.NEW_BLOCK_ANIMATION_DELAY); // Delay before adding new blocks
        }, PUZZLE_MODE.GRAVITY_ANIMATION_DELAY); // Delay before applying gravity
      }, PUZZLE_MODE.MATCH_ANIMATION_DELAY); // Delay before removing blocks
    } else {
      console.log("No cascading matches found, sequence complete");
      this.setState({ 
        animationPhase: 'idle',
        cascadeCount: 0
      });
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
    
    // Adjust padding for larger grids
    if (rows > 6) {
      styles.blockContainer.padding = 1;
    } else {
      styles.blockContainer.padding = 2;
    }
    
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
            borderWidth: 0, // Default to no border
          }
        ];
        
        // Adjust circle size for larger grids
        let innerCircleSize = '80%';
        if (rows > 6) {
          innerCircleSize = '90%'; // Make inner circle larger on bigger grids to use more space
        }
        
        // For selected blocks, use a solid white border
        if (cell.selected) {
          outerCircleStyle.push(styles.selectedOuterCircle);
          borderColor = '#FFFFFF'; // Solid white border
        }
        
        if (cell.matched) {
          stateStyles.push(styles.matchedBlock);
          // For matched blocks, make it a solid color by making the inner circle fill the outer circle
          backgroundColor = borderColor; // Make outer circle same as inner
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
        
        // Render the block
        blocks.push(
          <TouchableOpacity
            key={`row${i}col${j}`}
            style={[
              styles.blockContainer,
              styles.blockSize,
              ...stateStyles
            ]}
            onPress={() => this.handleBlockTap(i, j)}
            disabled={this.state.gameOver}
          >
            <View 
              style={outerCircleStyle}
            >
              <View 
                style={[
                  styles.innerCircle,
                  { 
                    backgroundColor: backgroundColor,
                    borderWidth: 0, // Explicitly prevent border
                    // For matched blocks, make inner circle fill the entire outer circle
                    width: cell.matched ? '100%' : innerCircleSize,
                    height: cell.matched ? '100%' : innerCircleSize,
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
    width: `${100 / 6}%`, // Default for 6x6, will be calculated dynamically
    height: `${100 / 6}%`, // Default for 6x6, will be calculated dynamically
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
  
  // Block styling
  blockContainer: {
    padding: 2, // This will be dynamically adjusted based on grid size
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
    borderWidth: 0, // Explicitly remove any border
    overflow: 'hidden', // Make sure content doesn't overflow
  },
  innerCircle: {
    width: '80%', // Default, will be overridden dynamically
    height: '80%', // Default, will be overridden dynamically
    borderRadius: 999,
    borderWidth: 0, // Explicitly remove any border
  },
  
  // Block states
  selectedBlock: {
    zIndex: 5, // Just keep the z-index to ensure proper stacking
  },
  // Solid white border for selected blocks
  selectedOuterCircle: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  matchedBlock: {
    // Style for matched blocks - solid color appearance with a slightly reduced scale
    opacity: 1.0, // Full opacity
    transform: [{ scale: 0.85 }], // Slight scale down to show "disappearing" effect
    overflow: 'hidden', // Make sure animation doesn't cause overflow
  },
  // This style is no longer used but kept for reference
  matchedOuterCircle: {
    borderWidth: 0, // No border needed anymore
  },
  newBlock: {
    // No transform - avoid overlapping and stuck states
  },
  
  // Animation delays
  delayShort: 300,
  delayMedium: 400,
  delayLong: 500,
});