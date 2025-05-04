import React, { Component } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, Text, PanResponder } from 'react-native';
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
      levelCompleted: false,
      debug: {
        lastTouch: null,
        touchCount: 0,
        swipeDetected: false,
        swipeDirection: null
      },
      // Store the currently selected block for swipes
      selectedBlock: null
    };
    
    // Set up constants for swipe detection
    this.SWIPE_THRESHOLD = 40; // Increased for more reliable detection
    
    // We'll track touches at the block level, not the board level
    this.blockRefs = {};
    
    // Create a simplified PanResponder that only handles swiping
    this.panResponder = PanResponder.create({
      // Only take over when there's movement (for swipes)
      onStartShouldSetPanResponder: () => false, // Let block touches work first
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only take over for significant movements (swipes)
        const { dx, dy } = gestureState;
        return Math.abs(dx) > 10 || Math.abs(dy) > 10;
      },
      
      // When significant movement is detected
      onPanResponderMove: (_, gestureState) => {
        const { dx, dy } = gestureState;
        console.log(`⚡ Board swipe detected: dx=${dx.toFixed(1)}, dy=${dy.toFixed(1)}`);
        
        // If we're not tracking any specific block yet, ignore
        if (!this.touchInfo?.isTracking || !this.touchInfo?.currentRow) {
          return;
        }
        
        // Only process significant swipes
        if (Math.abs(dx) > this.SWIPE_THRESHOLD || Math.abs(dy) > this.SWIPE_THRESHOLD) {
          this.processSwipeMovement(dx, dy);
        }
      },
      
      // When touch is released
      onPanResponderRelease: (_, gestureState) => {
        console.log('⚡ Board PanResponder - Touch released');
        
        // Check for small movements (taps) vs large movements (swipes)
        const { dx, dy } = gestureState;
        const isSmallMovement = Math.abs(dx) < this.SWIPE_THRESHOLD && Math.abs(dy) < this.SWIPE_THRESHOLD;
        
        // If we were tracking a touch and it had small movement (likely a tap),
        // don't treat it as a tap since the block's onPressIn already handled it
        if (this.touchInfo && this.touchInfo.isTracking && isSmallMovement) {
          console.log('⚡ Small movement detected, not treating as tap');
          // Don't call handleBlockPress here - that would cause double handling
        }
        
        // Reset tracking regardless
        if (this.touchInfo) {
          this.touchInfo.isTracking = false;
        }
      }
    });
  }

  // Check if position is within grid bounds
  isValidPosition(row, col) {
    const rows = this.props.numberofrows;
    const isValid = row >= 0 && row < rows && col >= 0 && col < rows;
    console.log(`Checking position [${row},${col}] - Valid: ${isValid}`);
    return isValid;
  }
  
  // Process a swipe movement from the current block
  processSwipeMovement(dx, dy) {
    // Make sure we have a valid block to swipe from
    if (!this.touchInfo || !this.touchInfo.isTracking) {
      console.log('⚠️ No block selected for swipe');
      return;
    }
    
    // Determine the primary direction of the swipe
    let direction = '';
    let dirEmoji = '';
    let targetRow = this.touchInfo.currentRow;
    let targetCol = this.touchInfo.currentCol;
    
    // Use the dominant axis to determine cardinal direction
    if (Math.abs(dx) > Math.abs(dy)) {
      // Horizontal swipe
      direction = dx > 0 ? 'RIGHT' : 'LEFT';
      dirEmoji = dx > 0 ? '➡️' : '⬅️';
      targetCol = dx > 0 ? targetCol + 1 : targetCol - 1;
    } else {
      // Vertical swipe
      direction = dy > 0 ? 'DOWN' : 'UP';
      dirEmoji = dy > 0 ? '⬇️' : '⬆️';
      targetRow = dy > 0 ? targetRow + 1 : targetRow - 1;
    }
    
    // Log the swipe with emoji and details
    console.log(`${dirEmoji} ${direction} swipe from [${this.touchInfo.currentRow},${this.touchInfo.currentCol}] to [${targetRow},${targetCol}]`);
    
    // Record the swipe in state for debug display
    this.setState(prevState => ({
      debug: {
        ...prevState.debug,
        swipeDetected: true,
        swipeDirection: direction
      }
    }));
    
    // Stop tracking to prevent multiple swipes from the same gesture
    this.touchInfo.isTracking = false;
    
    // Make sure the target position is valid
    if (this.isValidPosition(targetRow, targetCol)) {
      // Clear the visual selection
      const { grid } = this.props.game;
      const newGrid = grid.map(row => [...row]);
      
      if (newGrid[this.touchInfo.currentRow] && newGrid[this.touchInfo.currentCol]) {
        newGrid[this.touchInfo.currentRow][this.touchInfo.currentCol].selected = false;
        this.props.createGrid(newGrid);
      }
      
      // Reset the firstSelectedBlock
      this.firstSelectedBlock = null;
      
      // Process the swap
      console.log(`🎮 Processing swap from [${this.touchInfo.currentRow},${this.touchInfo.currentCol}] to [${targetRow},${targetCol}]`);
      this.processSwap(this.touchInfo.currentRow, this.touchInfo.currentCol, targetRow, targetCol);
    } else {
      console.log(`🚫 Cannot swipe - target [${targetRow},${targetCol}] is outside the grid`);
    }
  }

  // Process the swap between two blocks
  // Process matches found after a move - with completely rebuilt grid to avoid reference issues
  processMatchesFound(matches, newGrid) {
    console.log("Processing matches - with visual steps and deep grid recreation");
    
    // Calculate score with level multiplier
    const scoreGain = match3Helpers.calculateScore(matches, 1.0, this.props.game.level);
    const newScore = this.props.game.score + scoreGain;
    console.log(`Score increased by ${scoreGain} to ${newScore} (level ${this.props.game.level})`);
    this.props.updateScore(newScore);
    
    // CRITICAL FIX: Create a BRAND NEW grid with all blocks having unique IDs to avoid reference bugs
    // This is extreme but will help ensure each block is treated as a separate entity
    let completelyNewGrid = [];
    const numberofrows = this.props.numberofrows;
    
    // Create a completely new grid structure
    for (let row = 0; row < numberofrows; row++) {
      completelyNewGrid[row] = [];
      for (let col = 0; col < numberofrows; col++) {
        // Create a brand new block with unique ID
        const sourceBlock = newGrid[row][col];
        completelyNewGrid[row][col] = {
          ...sourceBlock,
          uniqueBlockId: `block-${row}-${col}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
        };
      }
    }
    
    // Use the new grid from now on
    newGrid = completelyNewGrid;
    
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
    
    // Create a list of all matched positions for easy lookup
    const matchedPositions = [];
    matches.forEach(match => {
      match.forEach(pos => {
        matchedPositions.push(pos);
      });
    });
    
    // Log all matched positions for debugging
    console.log(`Total matched positions: ${matchedPositions.length}`);
    matchedPositions.forEach(pos => {
      console.log(`Matched position: [${pos.row},${pos.col}]`);
    });
    
    // Mark the matched blocks and track recently swapped blocks with a completely different approach
    let swappedBlocksInfo = [];
    
    // First pass: identify all matched blocks and create fresh tracking info
    matches.forEach(match => {
      match.forEach(pos => {
        if (highlightedGrid[pos.row] && highlightedGrid[pos.row][pos.col]) {
          // Instead of just marking matched, create a COMPLETELY NEW OBJECT to guarantee no reference issues
          const originalBlock = highlightedGrid[pos.row][pos.col];
          
          // Check if this matched block was part of a recent swap
          if (originalBlock.wasSwapped) {
            console.log(`⚠️ CRITICAL: Swapped block at [${pos.row},${pos.col}] is part of a match!`);
            
            swappedBlocksInfo.push({
              row: pos.row,
              col: pos.col,
              swapPartner: originalBlock.swapPartner,
              isSourceBlock: true,
              matchId: `match-${pos.row}-${pos.col}-${Date.now()}`
            });
          }
          
          // Create a completely new object for the matched block
          highlightedGrid[pos.row][pos.col] = {
            ...originalBlock,
            matched: true,
            wasMatched: true,
            matchedAt: Date.now(),
            mustBeRemoved: true, // New flag to guarantee this gets removed
            uniqueMatchId: `match-${pos.row}-${pos.col}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
          };
        }
      });
    });
    
    // Log if we found swapped blocks in matches
    if (swappedBlocksInfo.length > 0) {
      console.log(`Found ${swappedBlocksInfo.length} swapped blocks that are part of matches`);
    }
    
    // Update grid to show highlighted matches
    this.props.createGrid(highlightedGrid);
    
    // STEP 2: After delay, remove matched blocks and replace with white
    setTimeout(() => {
      console.log("STEP 2: Removing matched blocks");
      const removedGrid = JSON.parse(JSON.stringify(highlightedGrid));
      
      // Remove matched blocks and replace with white spaces - completely rebuild removedGrid for safety
      const timestamp = Date.now(); // Use same timestamp for entire wave of new blocks
      
      // First ensure every position has a unique block ID
      for (let row = 0; row < numberofrows; row++) {
        for (let col = 0; col < numberofrows; col++) {
          // Generate a unique ID if one doesn't exist
          if (!removedGrid[row][col].uniqueBlockId) {
            removedGrid[row][col].uniqueBlockId = `block-${row}-${col}-${timestamp}-${Math.random().toString(36).substr(2, 5)}`;
          }
        }
      }
      
      // Now process the matched positions
      matches.forEach(match => {
        match.forEach(pos => {
          if (removedGrid[pos.row] && removedGrid[pos.row][pos.col]) {
            // Create a completely new empty block with unique ID
            removedGrid[pos.row][pos.col] = {
              color: -1,
              isEmpty: true,
              isWhiteSpace: true, // Special flag for rendering as white
              wasMatched: true, // Flag to indicate this was a matched block
              needsNewBlock: true, // Flag that this will need a new block
              uniqueBlockId: `empty-${pos.row}-${pos.col}-${timestamp}-${Math.random().toString(36).substr(2, 5)}`
            };
            
            console.log(`MATCH: Creating brand new empty block at [${pos.row},${pos.col}]`);
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
        
        // Log each column's state before applying gravity
        console.log("DETAILED COLUMN STATUS BEFORE GRAVITY:");
        for (let col = 0; col < numberofrows; col++) {
          let columnDesc = `Column ${col}: `;
          for (let row = 0; row < numberofrows; row++) {
            const block = gravityGrid[row][col];
            const isEmpty = block.isEmpty || block.color === -1;
            const wasMatched = block.wasMatched || false;
            const wasSwapped = block.wasSwapped || false;
            
            columnDesc += `[${row}]=${isEmpty ? 'empty' : block.color}${wasMatched ? 'M' : ''}${wasSwapped ? 'S' : ''} `;
          }
          console.log(columnDesc);
        }
        
        // DO NOT CLEAR wasSwapped FLAGS - let the gravity algorithm handle them with special care
        
        // IMPROVED GRAVITY ALGORITHM WITH SPECIAL HANDLING FOR MATCHED+SWAPPED BLOCKS
        // Apply gravity by processing each column separately
        for (let col = 0; col < numberofrows; col++) {
          console.log(`Applying gravity to column ${col}`);
          
          // Step 1: First separate blocks into regular blocks and swapped blocks
          const swappedBlocks = [];
          const regularBlocks = [];
          
          for (let row = 0; row < numberofrows; row++) {
            const block = gravityGrid[row][col];
            
            // Only process non-empty blocks
            if (!block.isEmpty && block.color !== -1) {
              const blockInfo = {
                ...block,
                originalPosition: { row, col }
              };
              
              // Determine if this is a swapped block
              if (block.wasSwapped) {
                console.log(`Column ${col}: Found swapped block at [${row},${col}], color ${block.color}`);
                swappedBlocks.push(blockInfo);
              } else {
                console.log(`Column ${col}: Found regular block at [${row},${col}], color ${block.color}`);
                regularBlocks.push(blockInfo);
              }
            }
          }
          
          console.log(`Column ${col}: Found ${swappedBlocks.length} swapped blocks and ${regularBlocks.length} regular blocks`);
          
          // Step 2: Clear the entire column
          for (let row = 0; row < numberofrows; row++) {
            gravityGrid[row][col] = {
              color: -1,
              isEmpty: true,
              matched: false,
              selected: false,
              needsNewBlock: true, // This is a position that will need a new block
              wasWhiteSpace: true  // This was originally a whitespace
            };
          }
          
          // Step 3: First place swapped blocks back in their EXACT positions
          // This is crucial for maintaining the game's integrity
          swappedBlocks.forEach(block => {
            const { originalPosition, ...blockProps } = block;
            
            // Only preserve non-matched swapped blocks
            if (!block.wasMatched) {
              console.log(`Column ${col}: Preserving swapped block at original position [${originalPosition.row},${originalPosition.col}]`);
              
              // Put the block back exactly where it was
              gravityGrid[originalPosition.row][originalPosition.col] = {
                ...blockProps,
                moved: false,
                falling: false,
                needsNewBlock: false,
                wasWhiteSpace: false
              };
            } else {
              console.log(`Column ${col}: Swapped block at [${originalPosition.row},${originalPosition.col}] was matched, not preserving`);
            }
          });
          
          // Step 4: Now place regular blocks from bottom up, avoiding swapped block positions
          // Start from the bottom of the grid
          let targetRow = numberofrows - 1;
          
          while (regularBlocks.length > 0 && targetRow >= 0) {
            // If this position already has a swapped block, skip it
            if (!gravityGrid[targetRow][col].isEmpty && !gravityGrid[targetRow][col].needsNewBlock) {
              console.log(`Column ${col}: Position [${targetRow},${col}] already has a block, skipping`);
              targetRow--;
              continue;
            }
            
            // Place the next regular block
            const nextBlock = regularBlocks.pop(); // Take blocks from the bottom of the column first
            const { originalPosition, ...blockProps } = nextBlock;
            
            console.log(`Column ${col}: Moving block from [${originalPosition.row},${originalPosition.col}] to [${targetRow},${col}]`);
            
            // Place block in the new position
            gravityGrid[targetRow][col] = {
              ...blockProps,
              moved: originalPosition.row !== targetRow, // Track if it moved
              falling: originalPosition.row !== targetRow, // Only animate if it actually moved
              originalRow: originalPosition.row, // Keep original position for animation
              needsNewBlock: false,
              wasWhiteSpace: false
            };
            
            // Move to next position up
            targetRow--;
          }
          
          // Any positions above that weren't filled will get new blocks in the next step
        }
        
        // Log each column's state after applying gravity
        console.log("DETAILED COLUMN STATUS AFTER GRAVITY:");
        for (let col = 0; col < numberofrows; col++) {
          let columnDesc = `Column ${col}: `;
          for (let row = 0; row < numberofrows; row++) {
            const block = gravityGrid[row][col];
            const isEmpty = block.isEmpty || block.color === -1;
            const needsNewBlock = block.needsNewBlock || false;
            
            columnDesc += `[${row}]=${isEmpty ? 'empty' : block.color}${needsNewBlock ? 'N' : ''} `;
          }
          console.log(columnDesc);
        }
        
        // Validate that we've processed all blocks correctly
        let emptyCount = 0;
        for (let row = 0; row < numberofrows; row++) {
          for (let col = 0; col < numberofrows; col++) {
            if (gravityGrid[row][col].isEmpty || gravityGrid[row][col].color === -1) {
              emptyCount++;
            }
          }
        }
        console.log(`After gravity, grid has ${emptyCount} empty spaces that need new blocks`);
        
        // Show the blocks after gravity is applied
        this.props.createGrid(gravityGrid);
        
        // STEP 4: After delay, add new blocks
        setTimeout(() => {
          console.log("STEP 4: Adding new blocks");
          
          // Create a grid with new blocks
          const finalGrid = JSON.parse(JSON.stringify(gravityGrid));
          
          // Add new blocks ONLY at positions marked needsNewBlock
          let addedBlocks = 0;
          for (let row = 0; row < numberofrows; row++) {
            for (let col = 0; col < numberofrows; col++) {
              // Only add blocks to positions that explicitly need them
              if (finalGrid[row][col].needsNewBlock === true) {
                // Generate a random color with a unique ID
                const newColor = Math.floor(Math.random() * this.props.numberofcolors);
                
                // Create a new random block
                finalGrid[row][col] = {
                  color: newColor,
                  isNew: true, // Mark as new for animation
                  id: `new-${row}-${col}-${Date.now()}`, // Add unique ID for tracking
                  fromTop: true // Flag that this came from the top
                };
                
                addedBlocks++;
                console.log(`Added new block at [${row},${col}] with color ${newColor}`);
              }
            }
          }
          
          console.log(`Added ${addedBlocks} new blocks to fill empty spaces`);
          
          // Final validation: Make sure there are no empty cells left
          let emptyCount = 0;
          for (let row = 0; row < numberofrows; row++) {
            for (let col = 0; col < numberofrows; col++) {
              if (finalGrid[row][col].isEmpty || finalGrid[row][col].color === -1) {
                console.warn(`WARNING: Cell at [${row},${col}] is still empty after filling new blocks`);
                
                // Emergency add a random block here
                const emergencyColor = Math.floor(Math.random() * this.props.numberofcolors);
                finalGrid[row][col] = {
                  color: emergencyColor,
                  isNew: true,
                  isEmergency: true,
                  id: `emergency-${row}-${col}-${Date.now()}`
                };
                
                emptyCount++;
              }
            }
          }
          
          if (emptyCount > 0) {
            console.warn(`Had to add ${emptyCount} emergency blocks to fill remaining empty cells`);
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
      console.log("⛔ Blocks are not adjacent, ignoring swap");
      return;
    }

    const swipeTime = new Date().toISOString().split('T')[1].substr(0, 12);
    console.log(`⏱️ ${swipeTime} - SWAP: Processing between [${row1},${col1}] and [${row2},${col2}]`);
    
    const { grid } = this.props.game;
    const { numberofrows } = this.props;
    
    // Cache references to original blocks for debugging
    const block1 = {
      row: row1,
      col: col1,
      color: grid[row1][col1].color
    };
    
    const block2 = {
      row: row2,
      col: col2,
      color: grid[row2][col2].color
    };
    
    console.log(`Original blocks: Block1[${row1},${col1}]: color ${block1.color}, Block2[${row2},${col2}]: color ${block2.color}`);
    
    // Clone the grid - use direct copy for React Native/Hermes compatibility
    let newGrid = grid.map(row => [...row]);
    
    // Swap the blocks using the improved swapBlocks function (adds wasSwapped flags)
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
    
    // Create a list of all matched positions for debugging
    const matchedPositions = [];
    matches.forEach(match => {
      match.forEach(pos => {
        matchedPositions.push(pos);
      });
    });
    
    // Check if either swapped block is part of a match
    const block1IsMatched = matchedPositions.some(
      mb => mb.row === block1.row && mb.col === block1.col
    );
    
    const block2IsMatched = matchedPositions.some(
      mb => mb.row === block2.row && mb.col === block2.col
    );
    
    console.log(`Swapped blocks match status: Block1[${block1.row},${block1.col}]: ${block1IsMatched ? 'MATCHED' : 'not matched'}, Block2[${block2.row},${block2.col}]: ${block2IsMatched ? 'MATCHED' : 'not matched'}`);
    
    if (matches.length > 0) {
      // Process matches using our unified method
      this.processMatchesFound(matches, newGrid);
    } else {
      // If no matches after swap, swap blocks back and clear wasSwapped flags
      console.log("No matches found, swapping back");
      
      // We need to manually clear the wasSwapped flags when swapping back
      const clearedGrid = newGrid.map(row => [...row]);
      for (let row = 0; row < numberofrows; row++) {
        for (let col = 0; col < numberofrows; col++) {
          if (clearedGrid[row][col].wasSwapped) {
            delete clearedGrid[row][col].wasSwapped;
            delete clearedGrid[row][col].swapPartner;
          }
        }
      }
      
      newGrid = match3Helpers.swapBlocks(
        clearedGrid,
        row2, col2,
        row1, col1
      );
      
      // Also clear the wasSwapped flags after swapping back
      for (let row = 0; row < numberofrows; row++) {
        for (let col = 0; col < numberofrows; col++) {
          if (newGrid[row][col].wasSwapped) {
            delete newGrid[row][col].wasSwapped;
            delete newGrid[row][col].swapPartner;
          }
        }
      }
      
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
    console.log("Match 3 Mode initialized - tap or swipe blocks to swap!");
    console.log("Swipe threshold:", this.SWIPE_THRESHOLD, "pixels");
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
  
  // We don't need to convert coordinates - we'll use the direct block references instead
  getGridPosition(x, y) {
    // This method is no longer needed but kept for compatibility
    console.log(`⚠️ Warning: Using direct block references instead of coordinate mapping`);
    return { row: 0, col: 0 }; // Dummy return
  }

  // PanResponder handlers
  handlePanResponderStart(evt, gestureState) {
    if (this.state.gameOver) return;
    
    // Debug all available properties to identify what we can use
    console.log('🔍 DEBUG TOUCH EVENT:', JSON.stringify({
      gestureState: {
        dx: gestureState.dx,
        dy: gestureState.dy,
        moveX: gestureState.moveX,
        moveY: gestureState.moveY,
        x0: gestureState.x0,
        y0: gestureState.y0,
      },
      nativeEvent: {
        pageX: evt.nativeEvent.pageX,
        pageY: evt.nativeEvent.pageY,
        locationX: evt.nativeEvent.locationX,
        locationY: evt.nativeEvent.locationY,
      }
    }));
    
    // Get touch coordinates - use gestureState for more reliable position
    // x0/y0 are the initial touch coordinates
    const { x0, y0 } = gestureState;
    const { pageX, pageY, locationX, locationY } = evt.nativeEvent;
    
    // Increment debug touch counter
    const touchCount = this.state.debug.touchCount + 1;
    
    // Use the fixed scaling approach
    const gridPos = this.getGridPosition(locationX, locationY);
    console.log(`🔍 Touch: (${locationX.toFixed(1)},${locationY.toFixed(1)}) => grid [${gridPos.row},${gridPos.col}]`);
    
    // Update debug state
    this.setState(prevState => ({
      debug: {
        ...prevState.debug,
        lastTouch: { x: locationX, y: locationY },
        touchCount,
        swipeDetected: false,
        swipeDirection: null
      }
    }));
    
    const { grid } = this.props.game;
    
    // Simply check if the grid position is valid
    if (this.isValidPosition(gridPos.row, gridPos.col) && 
        grid[gridPos.row] && 
        grid[gridPos.row][gridPos.col] && 
        grid[gridPos.row][gridPos.col].color !== -1 && 
        !grid[gridPos.row][gridPos.col].isEmpty) {
      
      // Found a valid block
      console.log(`🟢 Selected block at [${gridPos.row}, ${gridPos.col}]`);
      
      // Store touch info
      this.touchInfo = {
        startX: locationX,
        startY: locationY,
        currentRow: gridPos.row,
        currentCol: gridPos.col,
        isTracking: true
      };
      
      // Highlight the selected block
      let newGrid = grid.map(row => [...row]);
      newGrid[gridPos.row][gridPos.col].selected = true;
      this.props.createGrid(newGrid);
    } else {
      console.log(`🔴 Invalid or empty block at [${gridPos.row}, ${gridPos.col}]`);
    }
  }
  
  // Simplified swipe detection using cardinal directions only
  handlePanResponderMove(evt, gestureState) {
    // Only process if we have a valid starting position and are tracking
    if (!this.touchInfo?.isTracking) {
      console.log('⚠️ Not tracking a valid touch yet');
      return;
    }
    
    const { dx, dy } = gestureState;
    
    // Use emoji indicators for better visualization in logs
    let dirIndicator = '';
    if (Math.abs(dx) > Math.abs(dy)) {
      dirIndicator = dx > 0 ? '➡️' : '⬅️';
    } else {
      dirIndicator = dy > 0 ? '⬇️' : '⬆️';
    }
    
    console.log(`${dirIndicator} Swipe: dx=${dx.toFixed(1)}, dy=${dy.toFixed(1)}, needed: ${this.SWIPE_THRESHOLD}`);
    
    // Only process if movement exceeds threshold
    if (Math.abs(dx) > this.SWIPE_THRESHOLD || Math.abs(dy) > this.SWIPE_THRESHOLD) {
      // Determine the primary swipe direction - we only allow 4 cardinal directions
      let targetRow = this.touchInfo.currentRow;
      let targetCol = this.touchInfo.currentCol;
      let direction = '';
      
      // We only consider the dominant axis (largest movement)
      if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal swipe (LEFT/RIGHT)
        direction = dx > 0 ? 'RIGHT' : 'LEFT';
        targetCol = dx > 0 ? targetCol + 1 : targetCol - 1;
      } else {
        // Vertical swipe (UP/DOWN)
        direction = dy > 0 ? 'DOWN' : 'UP';
        targetRow = dy > 0 ? targetRow + 1 : targetRow - 1;
      }
      
      // Record in debug display
      this.setState(prevState => ({
        debug: {
          ...prevState.debug,
          swipeDetected: true,
          swipeDirection: direction
        }
      }));
      
      // Direction emoji for logging
      const dirEmoji = 
        direction === 'RIGHT' ? '➡️' :
        direction === 'LEFT' ? '⬅️' :
        direction === 'DOWN' ? '⬇️' : '⬆️';
      
      // Log the detected swipe with source and target positions
      console.log(`${dirEmoji} ${direction} swipe from [${this.touchInfo.currentRow},${this.touchInfo.currentCol}] to [${targetRow},${targetCol}]`);
      
      // Stop tracking to prevent multiple swipes from one gesture
      this.touchInfo.isTracking = false;
      
      // Only process swipe if target position is valid
      if (this.isValidPosition(targetRow, targetCol)) {
        // Clear selection highlight
        const { grid } = this.props.game;
        const newGrid = grid.map(row => [...row]);
        
        if (newGrid[this.touchInfo.currentRow]?.[this.touchInfo.currentCol]) {
          newGrid[this.touchInfo.currentRow][this.touchInfo.currentCol].selected = false;
          this.props.createGrid(newGrid);
        }
        
        // Process the swap with source and target positions
        console.log(`🎯 Final swap: [${this.touchInfo.currentRow},${this.touchInfo.currentCol}] to [${targetRow},${targetCol}]`);
        this.processSwap(this.touchInfo.currentRow, this.touchInfo.currentCol, targetRow, targetCol);
      } else {
        console.log(`🚫 Can't swipe - target [${targetRow},${targetCol}] is outside grid bounds`);
      }
    }
  }
  
  handlePanResponderEnd(evt, gestureState) {
    // We shouldn't need to handle tap events here as they should already be handled by onPressIn
    // Only log the end of tracking
    if (this.touchInfo && this.touchInfo.isTracking) {
      console.log(`🎮 Touch tracking ended at [${this.touchInfo.currentRow}, ${this.touchInfo.currentCol}]`);
      // Don't call handleBlockPress here - that would be duplicate processing
    }
    
    // Reset tracking state
    if (this.touchInfo) {
      this.touchInfo.isTracking = false;
    }
  }
  
  // Unified handler for both taps and swipes
  handleBlockTapOrSwipe(row, col) {
    console.log(`Block interaction at [${row},${col}]`);
    
    // If game is over, don't allow more moves
    if (this.state.gameOver) {
      console.log("Game is over, ignoring interaction");
      return;
    }
    
    const { grid } = this.props.game;
    const { numberofrows } = this.props;
    
    // Make sure coordinates are valid
    if (row < 0 || row >= numberofrows || col < 0 || col >= numberofrows) {
      console.log("Invalid coordinates, ignoring interaction");
      return;
    }
    
    // Clone the grid for updates
    let newGrid = grid.map(row => [...row]);
    
    // If no block is selected yet, select this one
    if (!this.firstSelectedBlock) {
      console.log("First block selected");
      // Mark this block as selected
      newGrid[row][col].selected = true;
      this.firstSelectedBlock = { row, col };
      
      // Update the grid
      this.props.createGrid(newGrid);
      return;
    }
    
    // Get previous selection
    const { row: firstRow, col: firstCol } = this.firstSelectedBlock;
    
    // If the same block is interacted with twice, deselect it
    if (firstRow === row && firstCol === col) {
      console.log("Same block selected twice, deselecting");
      newGrid[row][col].selected = false;
      this.firstSelectedBlock = null;
      this.props.createGrid(newGrid);
      return;
    }
    
    // Check if blocks are adjacent
    const isAdjacent = match3Helpers.areAdjacent(firstRow, firstCol, row, col);
    
    // Always clear the first selection
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
  
  // Legacy handler for backward compatibility - just forwards to our unified handler
  handleBlockPress(row, col) {
    // Just forward to our unified handler - don't duplicate logic
    this.handleBlockTapOrSwipe(row, col);
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
  
  // Improved cascade match handler
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
      
      // Create a list of all matched positions for easy lookup
      const matchedPositions = [];
      cascadeMatches.forEach(match => {
        match.forEach(pos => {
          matchedPositions.push(pos);
        });
      });
      
      console.log(`Cascade: Total matched positions: ${matchedPositions.length}`);
      
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
        console.log("CASCADE STEP 2: Removing matched blocks");
        const removedGrid = JSON.parse(JSON.stringify(highlightedGrid));
        
        // Remove matched blocks
        cascadeMatches.forEach(match => {
          match.forEach(pos => {
            if (removedGrid[pos.row] && removedGrid[pos.row][pos.col]) {
              // Replace with white empty block
              removedGrid[pos.row][pos.col] = {
                color: -1,
                isEmpty: true,
                isWhiteSpace: true, // Special flag for rendering as white
                wasMatched: true // Flag to indicate this was a matched block
              };
            }
          });
        });
        
        // Update grid to show white spaces
        this.props.createGrid(removedGrid);
        
        // STEP 3: After another delay, apply gravity and add new blocks
        setTimeout(() => {
          console.log("CASCADE STEP 3: Applying gravity");
          
          // Create a new grid for the final state with gravity
          const gravityGrid = JSON.parse(JSON.stringify(removedGrid));
          
          // IMPROVED CASCADE GRAVITY ALGORITHM WITH BETTER TRACKING
          // Apply gravity by processing each column separately
          for (let col = 0; col < numberofrows; col++) {
            console.log(`CASCADE: Applying gravity to column ${col}`);
            
            // Step 1: First separate blocks into regular blocks and swapped blocks
            const swappedBlocks = [];
            const regularBlocks = [];
            
            for (let row = 0; row < numberofrows; row++) {
              const block = gravityGrid[row][col];
              
              // Only process non-empty blocks
              if (!block.isEmpty && block.color !== -1) {
                const blockInfo = {
                  ...block,
                  originalPosition: { row, col }
                };
                
                // Determine if this is a swapped block
                if (block.wasSwapped) {
                  console.log(`CASCADE: Column ${col}: Found swapped block at [${row},${col}], color ${block.color}`);
                  swappedBlocks.push(blockInfo);
                } else {
                  console.log(`CASCADE: Column ${col}: Found regular block at [${row},${col}], color ${block.color}`);
                  regularBlocks.push(blockInfo);
                }
              }
            }
            
            console.log(`CASCADE: Column ${col}: Found ${swappedBlocks.length} swapped blocks and ${regularBlocks.length} regular blocks`);
            
            // Step 2: Clear the entire column
            for (let row = 0; row < numberofrows; row++) {
              gravityGrid[row][col] = {
                color: -1,
                isEmpty: true,
                matched: false,
                selected: false,
                needsNewBlock: true, // This is a position that will need a new block
                wasWhiteSpace: true  // This was originally a whitespace
              };
            }
            
            // Step 3: First place swapped blocks back in their EXACT positions
            // This is crucial for maintaining the game's integrity
            swappedBlocks.forEach(block => {
              const { originalPosition, ...blockProps } = block;
              
              // Only preserve non-matched swapped blocks
              if (!block.wasMatched) {
                console.log(`CASCADE: Column ${col}: Preserving swapped block at original position [${originalPosition.row},${originalPosition.col}]`);
                
                // Put the block back exactly where it was
                gravityGrid[originalPosition.row][originalPosition.col] = {
                  ...blockProps,
                  moved: false,
                  falling: false,
                  needsNewBlock: false,
                  wasWhiteSpace: false
                };
              } else {
                console.log(`CASCADE: Column ${col}: Swapped block at [${originalPosition.row},${originalPosition.col}] was matched, not preserving`);
              }
            });
            
            // Step 4: Now place regular blocks from bottom up, avoiding swapped block positions
            // Start from the bottom of the grid
            let targetRow = numberofrows - 1;
            
            while (regularBlocks.length > 0 && targetRow >= 0) {
              // If this position already has a block, skip it
              if (!gravityGrid[targetRow][col].isEmpty && !gravityGrid[targetRow][col].needsNewBlock) {
                console.log(`CASCADE: Column ${col}: Position [${targetRow},${col}] already has a block, skipping`);
                targetRow--;
                continue;
              }
              
              // Place the next regular block
              const nextBlock = regularBlocks.pop(); // Take blocks from the bottom of the column first
              const { originalPosition, ...blockProps } = nextBlock;
              
              console.log(`CASCADE: Column ${col}: Moving block from [${originalPosition.row},${originalPosition.col}] to [${targetRow},${col}]`);
              
              // Place block in the new position
              gravityGrid[targetRow][col] = {
                ...blockProps,
                moved: originalPosition.row !== targetRow, // Track if it moved
                falling: originalPosition.row !== targetRow, // Only animate if it actually moved
                originalRow: originalPosition.row, // Keep original position for animation
                needsNewBlock: false,
                wasWhiteSpace: false
              };
              
              // Move to next position up
              targetRow--;
            }
            
            // Any positions above that weren't filled will get new blocks in the next step
            let emptySpaces = 0;
            for (let row = 0; row < numberofrows; row++) {
              if (gravityGrid[row][col].needsNewBlock) {
                emptySpaces++;
              }
            }
            console.log(`CASCADE: Column ${col}: Left ${emptySpaces} empty spaces for new blocks`);
          }
          
          // Show the blocks after gravity is applied
          this.props.createGrid(gravityGrid);
          
          // STEP 4: After delay, add new blocks
          setTimeout(() => {
            console.log("CASCADE STEP 4: Adding new blocks");
            
            // Create a grid with new blocks
            const finalGrid = JSON.parse(JSON.stringify(gravityGrid));
            
            // Add new blocks ONLY at positions explicitly marked as needsNewBlock
            let addedBlocks = 0;
            for (let row = 0; row < numberofrows; row++) {
              for (let col = 0; col < numberofrows; col++) {
                // Only add blocks to positions that explicitly need them
                if (finalGrid[row][col].needsNewBlock === true) {
                  // Generate a random color with a unique ID
                  const newColor = Math.floor(Math.random() * this.props.numberofcolors);
                  
                  // Create a new random block
                  finalGrid[row][col] = {
                    color: newColor,
                    isNew: true, // Mark as new for animation
                    id: `cascade-new-${row}-${col}-${Date.now()}`, // Add unique ID for tracking
                    fromTop: true // Flag that this came from the top
                  };
                  
                  addedBlocks++;
                  console.log(`CASCADE: Added new block at [${row},${col}] with color ${newColor}`);
                }
              }
            }
            
            console.log(`CASCADE: Added ${addedBlocks} new blocks to fill empty spaces`);
            
            // Final validation: Make sure there are no empty cells left
            let emptyCount = 0;
            for (let row = 0; row < numberofrows; row++) {
              for (let col = 0; col < numberofrows; col++) {
                if (finalGrid[row][col].isEmpty || finalGrid[row][col].color === -1) {
                  console.warn(`CASCADE WARNING: Cell at [${row},${col}] is still empty after filling new blocks`);
                  
                  // Emergency add a random block here
                  const emergencyColor = Math.floor(Math.random() * this.props.numberofcolors);
                  finalGrid[row][col] = {
                    color: emergencyColor,
                    isNew: true,
                    isEmergency: true,
                    id: `cascade-emergency-${row}-${col}-${Date.now()}`
                  };
                  
                  emptyCount++;
                }
              }
            }
            
            if (emptyCount > 0) {
              console.warn(`CASCADE: Had to add ${emptyCount} emergency blocks to fill remaining empty cells`);
            }
            
            // Update the grid with the final state
            this.props.createGrid(finalGrid);
            
            // Check for more cascades (limited depth)
            if (this.state.cascadeCount < MATCH3_MODE.MAX_CASCADE_ITERATIONS) {
              this.setState({ cascadeCount: this.state.cascadeCount + 1 });
              
              setTimeout(() => {
                console.log(`Starting cascade iteration ${this.state.cascadeCount + 1}`);
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
          }, styles.delayMedium); // Delay before adding new blocks
        }, styles.delayMedium); // Delay before applying gravity
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
        
        // No block-specific PanResponder - using board-level instead
        
        // Render the block with TouchableOpacity and PanResponder
        blocks.push(
          <TouchableOpacity
            key={`row${i}col${j}`}
            style={[
              styles.blockContainer,
              styles.blockSize,
              ...stateStyles
            ]}
            onPressIn={() => {
              // When the block is pressed, directly store which block it is
              console.log(`🟦 Block at [${i},${j}] pressed`);
              
              // Store the current block for swipe origin
              this.touchInfo = {
                currentRow: i,
                currentCol: j,
                isTracking: true
              };
              
              // Start the block selection process
              this.handleBlockTapOrSwipe(i, j);
            }}
            activeOpacity={0.7} // Give visual feedback when pressed
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
    const { debug } = this.state;
    
    return (
      <View 
        style={[
          styles.gameBoard, 
          hasWon === false ? styles.gameOver : null
        ]}
      >
        {/* Main game board with pan responder */}
        <View 
          style={styles.game}
          {...this.panResponder.panHandlers}
          ref={ref => this.gameRef = ref}
          onLayout={event => {
            // Store board dimensions when layout changes
            const { width, height } = event.nativeEvent.layout;
            console.log(`📏 Game board dimensions: ${width}x${height}`);
          }}
        >
          {this.props.game.blocks}
        </View>
        
        {/* Detailed debug display - hidden in production */}
        {__DEV__ && (
          <View style={styles.debugContainer}>
            <Text style={styles.debugText}>
              🔢 Grid position: {this.touchInfo?.currentRow ?? '-'},{this.touchInfo?.currentCol ?? '-'} | 
              👆 Touch #{debug.touchCount}: {debug.lastTouch ? `(${debug.lastTouch.x.toFixed(0)},${debug.lastTouch.y.toFixed(0)})` : 'none'} | 
              {debug.swipeDetected ? `${debug.swipeDirection === 'RIGHT' ? '➡️' : 
                debug.swipeDirection === 'LEFT' ? '⬅️' : 
                debug.swipeDirection === 'DOWN' ? '⬇️' : 
                debug.swipeDirection === 'UP' ? '⬆️' : '❓'} ${debug.swipeDirection}` : '❌ No swipe'}
            </Text>
          </View>
        )}
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
  
  // Debug information display
  debugContainer: {
    marginTop: 10,
    padding: 5,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 5,
  },
  debugText: {
    fontSize: 10,
    color: '#333',
    textAlign: 'center',
  }
});