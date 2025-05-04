import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import AnimatedBlock from './AnimatedBlock';

// Get screen width to calculate block size
const screenWidth = Dimensions.get('window').width;
const BOARD_PADDING = 20;
const BOARD_SIZE = screenWidth - (BOARD_PADDING * 2);

const GameBoard = ({ 
  rows = 8, 
  colors = [
    { backgroundColor: '#5cb85c', borderColor: '#4cae4c' }, // Green
    { backgroundColor: '#5bc0de', borderColor: '#46b8da' }, // Blue
    { backgroundColor: '#f0ad4e', borderColor: '#eea236' }, // Yellow/Orange
    { backgroundColor: '#d9534f', borderColor: '#d43f3a' }, // Red
    { backgroundColor: '#9370DB', borderColor: '#8A2BE2' }, // Purple
    { backgroundColor: '#337ab7', borderColor: '#2e6da4' }, // Dark Blue
  ],
  onScoreUpdate
}) => {
  // Calculate block size based on board size and number of rows
  const blockSize = BOARD_SIZE / rows;
  
  // Game state
  const [grid, setGrid] = useState([]);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [score, setScore] = useState(0);
  const [movesCount, setMovesCount] = useState(0);
  
  // Ref to track animation state
  const animationInProgress = useRef(false);
  
  // Initialize game grid
  useEffect(() => {
    initializeGrid();
  }, []);
  
  // Generate a random grid with no initial matches
  const initializeGrid = () => {
    let newGrid = [];
    
    // Create a 2D array to check for matches
    let checkGrid = [];
    for (let i = 0; i < rows; i++) {
      checkGrid[i] = [];
    }
    
    // Generate the grid with blocks
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < rows; j++) {
        // Avoid creating initial matches
        let availableColors = [...Array(colors.length).keys()];
        
        // Check horizontal matches (check two blocks to the left)
        if (j >= 2) {
          if (checkGrid[i][j-1] === checkGrid[i][j-2]) {
            // Remove this color from options
            availableColors = availableColors.filter(c => c !== checkGrid[i][j-1]);
          }
        }
        
        // Check vertical matches (check two blocks above)
        if (i >= 2) {
          if (checkGrid[i-1][j] === checkGrid[i-2][j]) {
            // Remove this color from options
            availableColors = availableColors.filter(c => c !== checkGrid[i-1][j]);
          }
        }
        
        // If no colors are available (rare), use any color
        const colorIndex = availableColors.length > 0 
          ? availableColors[Math.floor(Math.random() * availableColors.length)]
          : Math.floor(Math.random() * colors.length);
          
        // Store the color index in our check grid
        checkGrid[i][j] = colorIndex;
        
        // Create the block
        newGrid.push({
          id: `${i}_${j}`,
          row: i,
          col: j,
          colorIndex: colorIndex,
          selected: false,
          matched: false,
          isNew: false,
          swapDirection: null,
          x: j * blockSize,
          y: i * blockSize,
        });
      }
    }
    
    setGrid(newGrid);
  };
  
  // Handle block press
  const handleBlockPress = (row, col) => {
    if (isAnimating) return;
    
    const blockIndex = grid.findIndex(block => block.row === row && block.col === col);
    
    if (blockIndex === -1) return;
    
    // If no block is selected yet, select this one and clear all other selections
    if (!selectedBlock) {
      const updatedGrid = grid.map((block, index) => ({
        ...block,
        selected: index === blockIndex
      }));
      
      setGrid(updatedGrid);
      setSelectedBlock({ row, col, index: blockIndex });
      return;
    }
    
    // If the same block is selected again, deselect it
    if (selectedBlock.row === row && selectedBlock.col === col) {
      const updatedGrid = grid.map(block => ({
        ...block,
        selected: false
      }));
      
      setGrid(updatedGrid);
      setSelectedBlock(null);
      return;
    }
    
    // Check if blocks are adjacent
    const isAdjacent = (
      (Math.abs(selectedBlock.row - row) === 1 && selectedBlock.col === col) ||
      (Math.abs(selectedBlock.col - col) === 1 && selectedBlock.row === row)
    );
    
    if (isAdjacent) {
      // Clear all selections before swap
      const updatedGrid = grid.map(block => ({
        ...block,
        selected: false
      }));
      
      setGrid(updatedGrid);
      
      // Attempt to swap blocks
      swapBlocks(selectedBlock.index, blockIndex);
      
      // Clear selection state
      setSelectedBlock(null);
    } else {
      // If not adjacent, deselect all and select only the new one
      const updatedGrid = grid.map((block, index) => ({
        ...block,
        selected: index === blockIndex
      }));
      
      setGrid(updatedGrid);
      setSelectedBlock({ row, col, index: blockIndex });
    }
  };
  
  // Handle swapping blocks - completely revised
  const swapBlocks = async (index1, index2) => {
    if (animationInProgress.current) return;
    animationInProgress.current = true;
    setIsAnimating(true);
    
    try {
      // Make sure both blocks exist
      if (index1 === -1 || index2 === -1 || !grid[index1] || !grid[index2]) {
        console.error("Invalid block indices for swap");
        return;
      }
      
      // Get the blocks we want to swap
      const block1 = grid[index1];
      const block2 = grid[index2];
      
      // Determine swap directions
      let direction1, direction2;
      
      if (block1.row === block2.row) {
        // Horizontal swap
        direction1 = block1.col < block2.col ? 'right' : 'left';
        direction2 = direction1 === 'right' ? 'left' : 'right';
      } else {
        // Vertical swap
        direction1 = block1.row < block2.row ? 'down' : 'up';
        direction2 = direction1 === 'down' ? 'up' : 'down';
      }
      
      console.log(`SWAP: [${block1.row},${block1.col}] ${direction1} <-> [${block2.row},${block2.col}] ${direction2}`);
      
      // Create a fresh grid with all selections cleared
      const freshGrid = grid.map(block => ({
        ...block,
        selected: false,
        swapDirection: null // Clear any previous swap directions
      }));
      
      // Now set the swap directions for the two blocks
      const animatingGrid = freshGrid.map((block, index) => {
        if (index === index1) {
          return { ...block, swapDirection: direction1 };
        } else if (index === index2) {
          return { ...block, swapDirection: direction2 };
        }
        return block;
      });
      
      // Update the grid to start animation
      setGrid(animatingGrid);
      setSelectedBlock(null);
      
      // Wait for animation to complete
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // STEP 2: Check if the swap creates a match
      const tempColorIndex = block1.colorIndex;
      
      // Create a test grid with swapped colors to check for matches
      const testGrid = animatingGrid.map((block, index) => {
        if (index === index1) {
          return { ...block, colorIndex: block2.colorIndex };
        } else if (index === index2) {
          return { ...block, colorIndex: tempColorIndex };
        }
        return block;
      });
      
      const matchedBlocks = findMatches(testGrid);
      const hasMatches = matchedBlocks.length > 0;
      
      if (hasMatches) {
        // STEP 3A: This is a successful swap with matches!
        console.log(`Successful swap with ${matchedBlocks.length} matches`);
        
        // Update moves count
        setMovesCount(prev => prev + 1);
        
        // Get a flattened list of matched positions for easier checking
        const matchedPositions = matchedBlocks.flat();
        
        // CRITICAL FIX: Check if either swapped block is part of a match
        // We need to log this information for debugging
        const block1IsMatched = matchedPositions.some(
          mb => mb.row === block1.row && mb.col === block1.col
        );
        
        const block2IsMatched = matchedPositions.some(
          mb => mb.row === block2.row && mb.col === block2.col
        );
        
        console.log(`Swapped blocks match status: Block1[${block1.row},${block1.col}]: ${block1IsMatched ? 'MATCHED' : 'not matched'}, Block2[${block2.row},${block2.col}]: ${block2IsMatched ? 'MATCHED' : 'not matched'}`);
        
        // Apply the color swap and mark matched blocks - with fixed logic
        const finalGrid = animatingGrid.map((block, index) => {
          // First, make a copy of the block with swapped colors
          let newBlock;
          
          if (index === index1) {
            // First swapped block - gets color from second block
            newBlock = {
              ...block,
              colorIndex: block2.colorIndex,
              swapDirection: null  // Clear animation state
            };
            
            // Check if this block is in a match
            newBlock.matched = matchedPositions.some(
              mb => mb.row === block.row && mb.col === block.col
            );
            
            return newBlock;
          } 
          else if (index === index2) {
            // Second swapped block
            const newBlock = {
              ...block,
              colorIndex: tempColorIndex,
              swapDirection: null  // Clear animation state
            };
            
            // Check if this block is in a match
            newBlock.matched = matchedPositions.some(
              mb => mb.row === block.row && mb.col === block.col
            );
            
            return newBlock;
          }
          
          // All other blocks - just check if they're in a match
          return {
            ...block,
            selected: false, // Clear any selections
            matched: matchedPositions.some(
              mb => mb.row === block.row && mb.col === block.col
            )
          };
        });
        
        setGrid(finalGrid);
        
        // Wait for match animation
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Process matches (clear and apply gravity)
        await processMatches(finalGrid, matchedBlocks);
      } else {
        // STEP 3B: No matches, so revert the swap
        console.log("No matches from swap, reverting to original state");
        
        // First, restore original colors
        const revertedGrid = animatingGrid.map((block, index) => {
          if (index === index1 || index === index2) {
            return {
              ...block,
              colorIndex: index === index1 ? block1.colorIndex : block2.colorIndex,
              swapDirection: null,
              selected: false
            };
          }
          return block;
        });
        
        // Update grid to reset positions and colors
        setGrid(revertedGrid);
      }
    } catch (error) {
      console.error("Error in swapBlocks:", error);
    } finally {
      // Always clean up animation state
      animationInProgress.current = false;
      setIsAnimating(false);
    }
  };
  
  // Find matches in the grid
  const findMatches = (currentGrid) => {
    const horizontalMatches = [];
    const verticalMatches = [];
    const gridArray = [];
    
    // Convert the grid data to a 2D array for easier processing
    for (let i = 0; i < rows; i++) {
      gridArray[i] = [];
      for (let j = 0; j < rows; j++) {
        const block = currentGrid.find(b => b.row === i && b.col === j);
        gridArray[i][j] = block ? block.colorIndex : -1;
      }
    }
    
    // Check horizontal matches
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < rows - 2; j++) {
        if (
          gridArray[i][j] !== -1 && 
          gridArray[i][j] === gridArray[i][j+1] && 
          gridArray[i][j] === gridArray[i][j+2]
        ) {
          // Found a horizontal match of at least 3
          let matchLength = 3;
          // Check if the match extends further
          while (j + matchLength < rows && gridArray[i][j] === gridArray[i][j+matchLength]) {
            matchLength++;
          }
          
          // Create a match group
          const matchGroup = [];
          
          // Add all blocks in this match
          for (let k = 0; k < matchLength; k++) {
            matchGroup.push({ row: i, col: j+k });
          }
          
          // Add this match group
          horizontalMatches.push(matchGroup);
          
          // Skip to the end of this match
          j += matchLength - 1;
        }
      }
    }
    
    // Check vertical matches
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < rows - 2; i++) {
        if (
          gridArray[i][j] !== -1 && 
          gridArray[i][j] === gridArray[i+1][j] && 
          gridArray[i][j] === gridArray[i+2][j]
        ) {
          // Found a vertical match of at least 3
          let matchLength = 3;
          // Check if the match extends further
          while (i + matchLength < rows && gridArray[i][j] === gridArray[i+matchLength][j]) {
            matchLength++;
          }
          
          // Create a match group
          const matchGroup = [];
          
          // Add all blocks in this match
          for (let k = 0; k < matchLength; k++) {
            matchGroup.push({ row: i+k, col: j });
          }
          
          // Add this match group
          verticalMatches.push(matchGroup);
          
          // Skip to the end of this match
          i += matchLength - 1;
        }
      }
    }
    
    // Combine horizontal and vertical matches
    return [...horizontalMatches, ...verticalMatches];
  };
  
  // Process matched blocks with improved debugging and validation
  const processMatches = async (currentGrid, matches) => {
    // First validate that we have valid matches to process
    if (!matches || matches.length === 0) {
      console.warn("No matches to process!");
      return;
    }
    
    // Calculate score (10 points per block, with multiplier for more blocks)
    const matchedPositions = matches.flat();
    const matchCount = matchedPositions.length;
    
    // Validate that the matched positions are valid
    if (matchCount === 0) {
      console.warn("No matched positions in the matches array!");
      return;
    }
    
    const matchScore = matchCount * 10 * (1 + (matchCount - 3) * 0.1);
    setScore(prev => {
      const newScore = prev + matchScore;
      if (onScoreUpdate) onScoreUpdate(newScore);
      return newScore;
    });
    
    console.log(`Processing ${matchCount} matched blocks in ${matches.length} match groups`);
    
    // Step 1: Create a validated 2D grid from the current state
    // This ensures we have a complete and valid representation of the board
    let initialGrid2D = Array(rows).fill().map(() => Array(rows).fill(null));
    
    // First pass: Fill the grid with the current blocks
    currentGrid.forEach(block => {
      if (block && block.row >= 0 && block.row < rows && block.col >= 0 && block.col < rows) {
        initialGrid2D[block.row][block.col] = block;
      }
    });
    
    // Second pass: Ensure every position has a valid block (should never happen, but just in case)
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < rows; col++) {
        if (!initialGrid2D[row][col]) {
          console.warn(`Found empty position at [${row},${col}], adding placeholder`);
          // Add a placeholder block
          initialGrid2D[row][col] = {
            id: `placeholder_${row}_${col}_${Date.now()}`,
            row: row,
            col: col,
            colorIndex: Math.floor(Math.random() * colors.length),
            selected: false,
            matched: false,
            isNew: false,
            swapDirection: null
          };
        }
      }
    }
    
    // Step 2: Create a new grid with matched blocks marked as empty
    let clearedGrid2D = initialGrid2D.map(row => 
      row.map(block => {
        // Check if this block is in a match
        const isMatched = matchedPositions.some(
          pos => pos.row === block.row && pos.col === block.col
        );
        
        if (isMatched) {
          // Mark this block as empty
          return {
            ...block,
            colorIndex: -1,  // Mark as empty
            matched: false   // Reset matched state
          };
        }
        return block;
      })
    );
    
    // Convert back to flat array for rendering
    const clearedGrid = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < rows; col++) {
        clearedGrid.push(clearedGrid2D[row][col]);
      }
    }
    
    // Update the grid
    setGrid(clearedGrid);
    
    // Allow time for match clear animation
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Step 3: Apply gravity with robust error checking
    // First convert the 2D grid back to a 1D array for consistent processing
    const flattenedClearedGrid = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < rows; col++) {
        flattenedClearedGrid.push(clearedGrid2D[row][col]);
      }
    }
    
    // Apply gravity column by column
    let newGrid = [];
    
    for (let col = 0; col < rows; col++) {
      // Step 1: Collect all non-empty blocks in this column
      const colBlocks = [];
      
      // Go from bottom to top
      for (let row = rows - 1; row >= 0; row--) {
        // Find the block at this position
        const block = flattenedClearedGrid.find(b => b.row === row && b.col === col);
        
        if (block && block.colorIndex !== -1) {
          // This is a valid non-empty block we need to keep
          colBlocks.push(block);
        }
      }
      
      // Step 2: Calculate how many empty spaces/new blocks we need
      const emptySpaces = rows - colBlocks.length;
      
      // Validation check
      if (emptySpaces < 0 || emptySpaces > rows) {
        console.error(`Invalid empty spaces count: ${emptySpaces} in column ${col}`);
        // Correct the count
        emptySpaces = Math.max(0, Math.min(rows, emptySpaces));
      }
      
      if (colBlocks.length + emptySpaces !== rows) {
        console.error(`Column ${col} has incorrect block count: ${colBlocks.length} blocks + ${emptySpaces} spaces != ${rows} total`);
      }
      
      // Step 3: Redistribute blocks from bottom to top
      let currentRow = rows - 1; // Start from the bottom row
      
      // Place existing blocks first (they fall to the bottom)
      for (let i = 0; i < colBlocks.length; i++) {
        const block = colBlocks[i];
        newGrid.push({
          ...block,
          row: currentRow,  // New row position
          col: col,         // Column stays the same
          // Clear any animation state for consistency
          swapDirection: null,
          selected: false
        });
        currentRow--; // Move up one row
      }
      
      // Step 4: Fill empty spaces at the top with new blocks
      // Use a timestamp base for all IDs in this column to avoid duplicates
      const timestamp = Date.now();
      
      for (let i = 0; i < emptySpaces; i++) {
        // Generate a truly unique ID
        const uniqueId = `new_${timestamp}_${col}_${i}_${Math.random().toString(36).substr(2, 5)}`;
        
        // Create a new block
        newGrid.push({
          id: uniqueId,
          row: currentRow,
          col: col,
          colorIndex: Math.floor(Math.random() * colors.length), // Random color
          selected: false,
          matched: false,
          isNew: true, // Mark as a new block for animation
          swapDirection: null
        });
        currentRow--; // Move up one row
      }
    }
    
    // Final validation - make sure we have the correct number of blocks
    if (newGrid.length !== rows * rows) {
      console.error(`CRITICAL ERROR: Grid has ${newGrid.length} blocks, expected ${rows * rows}`);
      
      // Emergency fix - add missing blocks or remove extra blocks
      if (newGrid.length < rows * rows) {
        // Add missing blocks
        const missingCount = rows * rows - newGrid.length;
        console.warn(`Adding ${missingCount} missing blocks`);
        
        // Create a set of existing positions for quick lookup
        const existingPositions = new Set();
        newGrid.forEach(block => {
          existingPositions.add(`${block.row},${block.col}`);
        });
        
        // Find missing positions and add blocks
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < rows; col++) {
            const posKey = `${row},${col}`;
            if (!existingPositions.has(posKey)) {
              // Add a new block at this position
              newGrid.push({
                id: `emergency_${row}_${col}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                row: row,
                col: col,
                colorIndex: Math.floor(Math.random() * colors.length),
                selected: false,
                matched: false,
                isNew: true,
                swapDirection: null
              });
              
              if (newGrid.length >= rows * rows) break;
            }
          }
          if (newGrid.length >= rows * rows) break;
        }
      } else if (newGrid.length > rows * rows) {
        // Remove extra blocks
        console.warn(`Removing ${newGrid.length - rows * rows} extra blocks`);
        newGrid = newGrid.slice(0, rows * rows);
      }
    }
    
    // Update the grid with blocks that have their new positions
    setGrid(newGrid);
    
    // Allow time for blocks to fall and new blocks to appear
    await new Promise(resolve => setTimeout(resolve, 400));
    
    // Reset isNew flag - this prevents ongoing animations from interfering
    const resetGrid = newGrid.map(block => ({
      ...block,
      isNew: false,
      // Clear any lingering animation states
      swapDirection: null,
      selected: false,
      matched: false
    }));
    
    setGrid(resetGrid);
    
    // Add a slight delay to ensure animations are complete
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Check for cascading matches
    const cascadeMatches = findMatches(resetGrid);
    
    if (cascadeMatches.length > 0) {
      console.log(`Found ${cascadeMatches.length} cascade matches!`);
      
      // Process cascading matches
      const flatMatchedPositions = cascadeMatches.flat();
      
      // Log the cascade matches found
      flatMatchedPositions.forEach(pos => {
        console.log(`Cascade match at [${pos.row},${pos.col}]`);
      });
      
      // Mark blocks as matched
      const gridWithCascadeMatches = resetGrid.map(block => {
        const isMatched = flatMatchedPositions.some(
          mb => mb.row === block.row && mb.col === block.col
        );
        
        return {
          ...block,
          matched: isMatched,
          // Important: reset any animation flags
          isNew: false,
          swapDirection: null,
          selected: false
        };
      });
      
      // Verify all matched positions have corresponding blocks
      flatMatchedPositions.forEach(pos => {
        const matchedBlock = gridWithCascadeMatches.find(
          b => b.row === pos.row && b.col === pos.col && b.matched
        );
        
        if (!matchedBlock) {
          console.error(`Missing matched block at [${pos.row},${pos.col}]!`);
        }
      });
      
      // Update the grid with matched blocks
      setGrid(gridWithCascadeMatches);
      
      // Wait for match animation to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Recursively process these matches
      await processMatches(gridWithCascadeMatches, cascadeMatches);
    } else {
      console.log("No cascade matches found.");
    }
  };
  
  // Render the game board
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreLabel}>Score</Text>
          <Text style={styles.scoreValue}>{score}</Text>
        </View>
        
        <View style={styles.movesContainer}>
          <Text style={styles.movesLabel}>Moves</Text>
          <Text style={styles.movesValue}>{movesCount}</Text>
        </View>
      </View>
      
      <View 
        style={[
          styles.board,
          { width: BOARD_SIZE, height: BOARD_SIZE }
        ]}
      >
        {grid.map((block) => (
          <AnimatedBlock
            key={block.id}
            id={block.id}
            row={block.row}
            col={block.col}
            color={colors[block.colorIndex] || '#CCC'}
            size={blockSize}
            selected={block.selected}
            matched={block.matched}
            isNew={block.isNew}
            isAnimating={isAnimating}
            swapDirection={block.swapDirection}
            onPress={handleBlockPress}
            style={{
              left: block.col * blockSize,
              top: block.row * blockSize,
            }}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: BOARD_PADDING,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 20,
  },
  scoreContainer: {
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  scoreValue: {
    fontSize: 24,
  },
  movesContainer: {
    alignItems: 'center',
  },
  movesLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  movesValue: {
    fontSize: 24,
  },
  board: {
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative', // This is important for absolute positioning of blocks
  },
});

export default GameBoard;