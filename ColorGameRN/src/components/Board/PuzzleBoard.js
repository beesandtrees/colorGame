import React, { Component } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, Text } from 'react-native';
// Don't use the Block component directly anymore
// import Block from '../Block/Block.js';

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
      gameOver: false
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
      animationPhase: 'idle' // Track current animation phase
    });
    
    this.firstSelectedBlock = null;
    
    // Initialize the game grid
    const grid = puzzleHelpers.generatePuzzleGrid(
      this.props.numberofrows,
      this.props.numberofcolors
    );
    
    // Mark all initial blocks as new for a nice entry animation
    for (let i = 0; i < this.props.numberofrows; i++) {
      for (let j = 0; j < this.props.numberofrows; j++) {
        grid[i][j].isNew = true;
        grid[i][j].newTime = Date.now() + ((i * this.props.numberofrows + j) * 30); // Staggered appearance
      }
    }
    
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
  
  componentWillUnmount() {
    // Cleanup if needed
  }
  
  UNSAFE_componentWillReceiveProps(nextProps) {
    if (this.props.grid !== nextProps.grid) {
      this.renderBlocks(
        nextProps.grid,
        nextProps.numberofrows,
        nextProps.colors
      );
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
    
    // If game is over or animation is in progress, don't allow more moves
    if (this.state.gameOver) {
      console.log("Game is over, ignoring tap");
      return;
    }
    
    // Don't allow interactions during animations
    if (this.state.animationPhase !== 'idle') {
      console.log(`Animation in progress (${this.state.animationPhase}), ignoring tap`);
      return;
    }
    
    // Make sure coordinates are valid
    if (row < 0 || row >= numberofrows || col < 0 || col >= numberofrows) {
      console.log("Invalid coordinates, ignoring tap");
      return;
    }
    
    // Clone the grid to avoid direct state mutation
    let newGrid = JSON.parse(JSON.stringify(grid));
    
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
    
    // Log the grid state before checking matches
    console.log("GRID BEFORE CHECKING MATCHES:", 
      JSON.stringify(newGrid.map(row => row.map(cell => cell.color))));
    
    // Check for matches
    const matches = puzzleHelpers.checkMatches(
      newGrid,
      numberofrows,
      numberofrows
    );
    
    console.log(`Found ${matches.length} matches after swap`);
    
    // For clearer debugging, log each match found
    matches.forEach((match, index) => {
      console.log(`Match ${index + 1}:`, 
        JSON.stringify(match.map(pos => `[${pos.row},${pos.col}]=${newGrid[pos.row][pos.col].color}`)));
    });
    
    if (matches.length > 0) {
      console.log("MATCH SEQUENCE STARTING - Found matches, beginning animation sequence");
      
      // Set animation phase to prevent interaction during animations
      this.setState({ animationPhase: 'matching' });
      
      // Calculate score
      const scoreGain = puzzleHelpers.calculateScore(matches);
      const newScore = this.props.game.score + scoreGain;
      console.log(`Score increased by ${scoreGain} to ${newScore}`);
      this.props.updateScore(newScore);
      
      // STEP 1: Just highlight the matched blocks without removing them yet
      const matchHighlightGrid = JSON.parse(JSON.stringify(newGrid));
      
      // Mark matched cells but don't empty them yet
      matches.forEach((match) => {
        match.forEach(pos => {
          if (matchHighlightGrid[pos.row] && matchHighlightGrid[pos.row][pos.col]) {
            matchHighlightGrid[pos.row][pos.col].matched = true;
            matchHighlightGrid[pos.row][pos.col].toBeRemoved = true; // Mark for removal later
          }
        });
      });
      
      // Update the grid to show the matched blocks
      this.props.createGrid(matchHighlightGrid);
      this.renderBlocks(matchHighlightGrid, numberofrows, this.props.colors);
      console.log("STEP 1: Highlighted matched blocks");
      
      // STEP 2: After a delay, remove the matched blocks
      setTimeout(() => {
        console.log("STEP 2: Removing matched blocks");
        
        const gridWithRemovedBlocks = JSON.parse(JSON.stringify(matchHighlightGrid));
        
        // Remove matched blocks
        for (let i = 0; i < numberofrows; i++) {
          for (let j = 0; j < numberofrows; j++) {
            if (gridWithRemovedBlocks[i][j].toBeRemoved) {
              gridWithRemovedBlocks[i][j] = {
                color: -1,
                isEmpty: true,
                matched: false,
                selected: false
              };
            }
          }
        }
        
        // Update the grid to show empty spaces
        this.props.createGrid(gridWithRemovedBlocks);
        this.renderBlocks(gridWithRemovedBlocks, numberofrows, this.props.colors);
        
        // STEP 3: After another delay, apply gravity (blocks falling)
        setTimeout(() => {
          console.log("STEP 3: Applying gravity, blocks falling");
          this.setState({ animationPhase: 'falling' });
          
          // Calculate future positions for animation
          const gridWithFallingAnimation = JSON.parse(JSON.stringify(gridWithRemovedBlocks));
          const fallingBlocks = [];
          
          // Mark where blocks will fall
          for (let col = 0; col < numberofrows; col++) {
            let emptyRow = -1;
            
            // First, find empty spaces from bottom to top
            for (let row = numberofrows - 1; row >= 0; row--) {
              if (gridWithFallingAnimation[row][col].isEmpty) {
                if (emptyRow === -1) {
                  emptyRow = row;
                }
              } 
              else if (emptyRow !== -1) {
                // Block needs to fall to emptyRow
                fallingBlocks.push({
                  fromRow: row,
                  fromCol: col,
                  toRow: emptyRow,
                  toCol: col,
                  color: gridWithFallingAnimation[row][col].color
                });
                
                // Mark it as falling for animation
                gridWithFallingAnimation[row][col].falling = true;
                gridWithFallingAnimation[row][col].targetRow = emptyRow;
                
                // Update empty row
                emptyRow--;
              }
            }
          }
          
          // Show falling animation
          this.props.createGrid(gridWithFallingAnimation);
          this.renderBlocks(gridWithFallingAnimation, numberofrows, this.props.colors);
          
          // STEP 4: Update the grid with blocks in their new positions
          setTimeout(() => {
            console.log("STEP 4: Updating grid with fallen blocks");
            
            // Actually apply the gravity
            const gridWithGravity = JSON.parse(JSON.stringify(gridWithRemovedBlocks));
            
            // Apply the moves calculated earlier
            for (const block of fallingBlocks) {
              // Move the block to its destination
              gridWithGravity[block.toRow][block.toCol] = {
                ...gridWithGravity[block.fromRow][block.fromCol],
                falling: false,
                justFell: true // Mark for animation
              };
              
              // Clear the original position
              gridWithGravity[block.fromRow][block.fromCol] = {
                color: -1,
                isEmpty: true,
                matched: false,
                selected: false
              };
            }
            
            // Update the grid with blocks in their new positions
            this.props.createGrid(gridWithGravity);
            this.renderBlocks(gridWithGravity, numberofrows, this.props.colors);
            
            // STEP 5: After another delay, add new blocks at the top
            setTimeout(() => {
              console.log("STEP 5: Adding new blocks at the top");
              this.setState({ animationPhase: 'adding' });
              
              // Create new blocks for empty spots
              const finalGrid = JSON.parse(JSON.stringify(gridWithGravity));
              
              // Fill empty spaces at the top with new blocks
              for (let col = 0; col < numberofrows; col++) {
                for (let row = 0; row < numberofrows; row++) {
                  if (finalGrid[row][col].isEmpty) {
                    // Generate random color for the new block
                    const newColor = Math.floor(Math.random() * this.props.numberofcolors);
                    
                    finalGrid[row][col] = {
                      color: newColor,
                      isNew: true,
                      matched: false,
                      selected: false,
                      isEmpty: false
                    };
                  }
                }
              }
              
              // Update the grid with new blocks
              const updatedGrid = finalGrid;
              this.props.createGrid(updatedGrid);
              this.renderBlocks(updatedGrid, numberofrows, this.props.colors);
              
              // STEP 6: Check for cascade matches after a delay
              setTimeout(() => {
                console.log("STEP 6: Checking for cascade matches");
                this.setState({ animationPhase: 'idle' });
                
                // Check for cascading matches with our new grid
                this.checkForCascadeMatches(updatedGrid, newScore);
              }, PUZZLE_MODE.NEW_BLOCK_ANIMATION_DELAY);
            }, PUZZLE_MODE.GRAVITY_ANIMATION_DELAY);
          }, PUZZLE_MODE.GRAVITY_ANIMATION_DELAY);
        }, PUZZLE_MODE.MATCH_ANIMATION_DELAY);
      }, PUZZLE_MODE.MATCH_ANIMATION_DELAY);
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
  }
  
  // Helper function to check for cascade matches
  checkForCascadeMatches(grid, currentScore) {
    console.log("Checking for cascading matches...");
    
    // Setup for cascade processing
    let currentGrid = grid;
    let cascadeScore = currentScore;
    let cascadeIteration = 0;
    const numberofrows = this.props.numberofrows;
    const maxCascades = PUZZLE_MODE.MAX_CASCADE_ITERATIONS;
    
    // Check for matches
    const cascadeMatches = puzzleHelpers.checkMatches(
      currentGrid,
      numberofrows,
      numberofrows
    );
    
    if (cascadeMatches.length > 0) {
      console.log(`Found ${cascadeMatches.length} cascading matches!`);
      
      // Process cascade matches with the same phased animation sequence
      this.setState({ animationPhase: 'matching' });
      
      // RECURSIVE CALL - This will start a new animation sequence for the cascade
      const scoreGain = puzzleHelpers.calculateScore(cascadeMatches, 1.5); // Apply cascade multiplier
      const newScore = cascadeScore + scoreGain;
      console.log(`Cascade score increased by ${scoreGain} to ${newScore}`);
      this.props.updateScore(newScore);
      
      // Highlight cascade matches and start a new sequence
      const matchHighlightGrid = JSON.parse(JSON.stringify(currentGrid));
      
      // Mark matched cells but don't empty them yet
      cascadeMatches.forEach((match) => {
        match.forEach(pos => {
          if (matchHighlightGrid[pos.row] && matchHighlightGrid[pos.row][pos.col]) {
            matchHighlightGrid[pos.row][pos.col].matched = true;
            matchHighlightGrid[pos.row][pos.col].toBeRemoved = true; // Mark for removal later
          }
        });
      });
      
      // Update the grid to show the matched blocks
      this.props.createGrid(matchHighlightGrid);
      this.renderBlocks(matchHighlightGrid, numberofrows, this.props.colors);
      
      // Continue with the same phased animation sequence for cascades (recursively)
      setTimeout(() => {
        // Continue processing the cascade with the same animation sequence
        // (This will effectively start a new cycle of the full animation)
        this.processCascadeStep2(matchHighlightGrid, newScore, cascadeMatches);
      }, PUZZLE_MODE.MATCH_ANIMATION_DELAY);
    } else {
      console.log("No cascading matches found, sequence complete");
    }
  }
  
  // Helper methods for cascade steps to avoid duplicating code
  processCascadeStep2(matchHighlightGrid, cascadeScore, cascadeMatches) {
    console.log("CASCADE STEP 2: Removing matched blocks");
    const numberofrows = this.props.numberofrows;
    
    const gridWithRemovedBlocks = JSON.parse(JSON.stringify(matchHighlightGrid));
    
    // Remove matched blocks
    for (let i = 0; i < numberofrows; i++) {
      for (let j = 0; j < numberofrows; j++) {
        if (gridWithRemovedBlocks[i][j].toBeRemoved) {
          gridWithRemovedBlocks[i][j] = {
            color: -1,
            isEmpty: true,
            matched: false,
            selected: false
          };
        }
      }
    }
    
    // Update the grid to show empty spaces
    this.props.createGrid(gridWithRemovedBlocks);
    this.renderBlocks(gridWithRemovedBlocks, numberofrows, this.props.colors);
    
    setTimeout(() => {
      this.processCascadeStep3(gridWithRemovedBlocks, cascadeScore);
    }, PUZZLE_MODE.MATCH_ANIMATION_DELAY);
  }
  
  processCascadeStep3(gridWithRemovedBlocks, cascadeScore) {
    console.log("CASCADE STEP 3: Applying gravity, blocks falling");
    this.setState({ animationPhase: 'falling' });
    const numberofrows = this.props.numberofrows;
    
    // Calculate future positions for animation
    const gridWithFallingAnimation = JSON.parse(JSON.stringify(gridWithRemovedBlocks));
    const fallingBlocks = [];
    
    // Mark where blocks will fall
    for (let col = 0; col < numberofrows; col++) {
      let emptyRow = -1;
      
      // First, find empty spaces from bottom to top
      for (let row = numberofrows - 1; row >= 0; row--) {
        if (gridWithFallingAnimation[row][col].isEmpty) {
          if (emptyRow === -1) {
            emptyRow = row;
          }
        } 
        else if (emptyRow !== -1) {
          // Block needs to fall to emptyRow
          fallingBlocks.push({
            fromRow: row,
            fromCol: col,
            toRow: emptyRow,
            toCol: col,
            color: gridWithFallingAnimation[row][col].color
          });
          
          // Mark it as falling for animation
          gridWithFallingAnimation[row][col].falling = true;
          gridWithFallingAnimation[row][col].targetRow = emptyRow;
          
          // Update empty row
          emptyRow--;
        }
      }
    }
    
    // Show falling animation
    this.props.createGrid(gridWithFallingAnimation);
    this.renderBlocks(gridWithFallingAnimation, numberofrows, this.props.colors);
    
    setTimeout(() => {
      this.processCascadeStep4(gridWithRemovedBlocks, fallingBlocks, cascadeScore);
    }, PUZZLE_MODE.GRAVITY_ANIMATION_DELAY);
  }
  
  processCascadeStep4(gridWithRemovedBlocks, fallingBlocks, cascadeScore) {
    console.log("CASCADE STEP 4: Updating grid with fallen blocks");
    const numberofrows = this.props.numberofrows;
    
    // Actually apply the gravity
    const gridWithGravity = JSON.parse(JSON.stringify(gridWithRemovedBlocks));
    
    // Apply the moves calculated earlier
    for (const block of fallingBlocks) {
      // Move the block to its destination
      gridWithGravity[block.toRow][block.toCol] = {
        ...gridWithGravity[block.fromRow][block.fromCol],
        falling: false,
        justFell: true // Mark for animation
      };
      
      // Clear the original position
      gridWithGravity[block.fromRow][block.fromCol] = {
        color: -1,
        isEmpty: true,
        matched: false,
        selected: false
      };
    }
    
    // Update the grid with blocks in their new positions
    this.props.createGrid(gridWithGravity);
    this.renderBlocks(gridWithGravity, numberofrows, this.props.colors);
    
    setTimeout(() => {
      this.processCascadeStep5(gridWithGravity, cascadeScore);
    }, PUZZLE_MODE.GRAVITY_ANIMATION_DELAY);
  }
  
  processCascadeStep5(gridWithGravity, cascadeScore) {
    console.log("CASCADE STEP 5: Adding new blocks at the top");
    this.setState({ animationPhase: 'adding' });
    const numberofrows = this.props.numberofrows;
    
    // Create new blocks for empty spots
    const finalGrid = JSON.parse(JSON.stringify(gridWithGravity));
    
    // Fill empty spaces at the top with new blocks
    for (let col = 0; col < numberofrows; col++) {
      for (let row = 0; row < numberofrows; row++) {
        if (finalGrid[row][col].isEmpty) {
          // Generate random color for the new block
          const newColor = Math.floor(Math.random() * this.props.numberofcolors);
          
          finalGrid[row][col] = {
            color: newColor,
            isNew: true,
            matched: false,
            selected: false,
            isEmpty: false
          };
        }
      }
    }
    
    // Update the grid with new blocks
    const updatedGrid = finalGrid;
    this.props.createGrid(updatedGrid);
    this.renderBlocks(updatedGrid, numberofrows, this.props.colors);
    
    setTimeout(() => {
      console.log("CASCADE STEP 6: Checking for more cascade matches");
      this.setState({ animationPhase: 'idle' });
      
      // Recursive check for more cascades
      this.checkForCascadeMatches(updatedGrid, cascadeScore);
    }, PUZZLE_MODE.NEW_BLOCK_ANIMATION_DELAY);
      
      // TEMPORARILY DISABLE AUTOMATIC LEVEL CHANGES FOR DEBUGGING
      // This was causing unexpected grid resets
      
      /* 
      // Check if level up is needed (every 100 points)
      const currentLevel = this.props.game.level;
      const newLevel = Math.floor(newScore / 100) + 1;
      
      if (newLevel > currentLevel) {
        console.log(`Leveling up to ${newLevel}!`);
        this.props.updateLevel(newLevel);
        
        // Update level configuration
        const level = puzzleHelpers.createPuzzleLevel(newLevel);
        this.setState({ level });
      }
      */
    // } else {
    //   console.log("No matches found, swapping back");
    //   // If no matches, swap back
    //   newGrid = puzzleHelpers.swapBlocks(
    //     newGrid,
    //     row, col,
    //     firstRow, firstCol
    //   );
    //   this.props.createGrid(newGrid);
    // }
    
    // Check if game is over (reached move limit)
    if (this.state.moves >= this.props.level.moveLimit) {
      this.setState({ gameOver: true });
      this.props.didWin(false);
      
      // Show game over alert
      Alert.alert(
        "Game Over",
        `You've used all ${this.props.level.moveLimit} moves!\nFinal Score: ${this.props.game.score}`,
        [
          { 
            text: "Try Again", 
            onPress: () => {
              if (this.props.restart) {
                this.props.restart(true);
                // We must reinitialize the game state after the restart completes
                setTimeout(() => {
                  this.initializeGame();
                }, 300);
              }
            }
          }
        ]
      );
    }
  }
  
  renderBlocks(grid, rows, colors) {
    let blocks = [];
    
    // Create the block components
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < rows; j++) {
        // Get the cell from the grid
        const cell = grid[i] && grid[i][j] ? grid[i][j] : null;
        
        if (!cell || cell.color === -1 || cell.isEmpty) {
          // For empty cells, use a transparent block
          blocks.push(
            <View
              key={`row${i}col${j}`}
              style={[
                styles.emptyBlock,
                { 
                  width: `${100 / rows}%`, 
                  height: `${100 / rows}%`,
                  backgroundColor: 'transparent',
                }
              ]}
            />
          );
          continue;
        }
        
        let backgroundColor, borderColor;
        let blockStyle = { width: `${100 / rows}%`, height: `${100 / rows}%` };
        
        // Handle cells with valid colors
        if (cell.color >= 0 && cell.color < colors.length) {
          backgroundColor = colors[cell.color].backgroundColor;
          
          // Different border styling based on cell state
          if (cell.selected) {
            // Selected blocks have white border
            borderColor = 'white';
            blockStyle = { 
              ...blockStyle, 
              transform: [{ scale: 1.05 }],
              zIndex: 2
            };
          } else if (cell.matched || cell.toBeRemoved) {
            // Matched blocks animation - highlight before removal
            borderColor = colors[cell.color].borderColor;
            blockStyle = { 
              ...blockStyle, 
              opacity: 0.85,
              transform: [{ scale: 1.1 }],
              zIndex: 2
            };
          } else if (cell.isNew) {
            // New blocks animation
            borderColor = colors[cell.color].borderColor;
            blockStyle = { 
              ...blockStyle, 
              transform: [
                { scale: 1.15 }, 
                { translateY: -5 }
              ],
              opacity: 1,
              zIndex: 3
            };
            
            // Reset the isNew flag after rendering with a longer animation
            setTimeout(() => {
              cell.isNew = false;
              // Create a new grid without the isNew flags
              const updatedGrid = JSON.parse(JSON.stringify(this.props.game.grid));
              if (updatedGrid[i] && updatedGrid[i][j]) {
                updatedGrid[i][j].isNew = false;
              }
              this.props.createGrid(updatedGrid);
              this.renderBlocks(updatedGrid, this.props.numberofrows, this.props.colors);
            }, PUZZLE_MODE.NEW_BLOCK_ANIMATION_DELAY);
          } else if (cell.falling) {
            // Falling blocks animation
            borderColor = colors[cell.color].borderColor;
            blockStyle = { 
              ...blockStyle, 
              transform: [
                { scale: 1.0 },
                { translateY: 10 } // Give a sense of downward motion
              ],
              opacity: 0.95,
              zIndex: 2
            };
            
            // Reset the falling flag after animation completes
            setTimeout(() => {
              cell.falling = false;
              // Create a new grid without the falling flags
              const updatedGrid = JSON.parse(JSON.stringify(this.props.game.grid));
              if (updatedGrid[i] && updatedGrid[i][j]) {
                updatedGrid[i][j].falling = false;
              }
              this.props.createGrid(updatedGrid);
              this.renderBlocks(updatedGrid, this.props.numberofrows, this.props.colors);
            }, PUZZLE_MODE.GRAVITY_ANIMATION_DELAY);
          } else if (cell.justFell) {
            // Blocks that have just finished falling into place
            borderColor = colors[cell.color].borderColor;
            blockStyle = { 
              ...blockStyle, 
              transform: [{ scale: 1.05 }],
              opacity: 1.0
            };
            
            // Reset the justFell flag after animation completes
            setTimeout(() => {
              cell.justFell = false;
              // Create a new grid without the justFell flags
              const updatedGrid = JSON.parse(JSON.stringify(this.props.game.grid));
              if (updatedGrid[i] && updatedGrid[i][j]) {
                updatedGrid[i][j].justFell = false;
              }
              this.props.createGrid(updatedGrid);
              this.renderBlocks(updatedGrid, this.props.numberofrows, this.props.colors);
            }, PUZZLE_MODE.GRAVITY_ANIMATION_DELAY);
          } else {
            // Normal blocks
            borderColor = colors[cell.color].borderColor;
          }
        } else {
          // Fallback for invalid color indices
          backgroundColor = '#ccc';
          borderColor = '#999';
        }
        
        // Add block component to the array with the specific styles
        blocks.push(
          <TouchableOpacity
            key={`row${i}col${j}`}
            style={[
              styles.blockContainer,
              blockStyle
            ]}
            onPress={() => this.handleBlockTap(i, j)}
            disabled={cell.matched || this.state.gameOver}
          >
            <View 
              style={[
                styles.outerCircle,
                { backgroundColor: borderColor }
              ]}
            >
              <View 
                style={[
                  styles.innerCircle,
                  { backgroundColor: backgroundColor }
                ]}
              >
                {/* No debug text */}
              </View>
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
  },
  blockContainer: {
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outerCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerCircle: {
    width: '80%',
    height: '80%',
    borderRadius: 999,
  }
});