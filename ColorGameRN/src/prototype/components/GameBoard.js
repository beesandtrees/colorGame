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
    
    // If no block is selected yet, select this one
    if (!selectedBlock) {
      const updatedGrid = grid.map((block, index) => 
        index === blockIndex ? { ...block, selected: true } : block
      );
      
      setGrid(updatedGrid);
      setSelectedBlock({ row, col, index: blockIndex });
      return;
    }
    
    // If the same block is selected again, deselect it
    if (selectedBlock.row === row && selectedBlock.col === col) {
      const updatedGrid = grid.map((block, index) => 
        index === blockIndex ? { ...block, selected: false } : block
      );
      
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
      // Attempt to swap blocks
      swapBlocks(selectedBlock.index, blockIndex);
    } else {
      // If not adjacent, deselect the previous and select the new one
      const updatedGrid = grid.map((block, index) => ({
        ...block,
        selected: index === blockIndex
      }));
      
      setGrid(updatedGrid);
      setSelectedBlock({ row, col, index: blockIndex });
    }
  };
  
  // Handle swapping blocks
  const swapBlocks = async (index1, index2) => {
    if (animationInProgress.current) return;
    animationInProgress.current = true;
    setIsAnimating(true);
    
    // Determine swap direction for animations
    const block1 = grid[index1];
    const block2 = grid[index2];
    
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
    
    // Start the animation
    const updatedGrid = grid.map((block, index) => {
      if (index === index1) {
        return { ...block, swapDirection: direction1, selected: false };
      } else if (index === index2) {
        return { ...block, swapDirection: direction2, selected: false };
      }
      return block;
    });
    
    setGrid(updatedGrid);
    setSelectedBlock(null);
    
    // Wait for animation to complete
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Swap the colors in the data
    const tempColorIndex = grid[index1].colorIndex;
    
    // Create new grid with swapped colors but KEEP the swapDirection for now
    // This ensures the blocks don't move back during animation
    const swappedGrid = grid.map((block, index) => {
      if (index === index1) {
        return { 
          ...block, 
          colorIndex: grid[index2].colorIndex,
          // Keep swapDirection
        };
      } else if (index === index2) {
        return { 
          ...block, 
          colorIndex: tempColorIndex,
          // Keep swapDirection
        };
      }
      return block;
    });
    
    // Check for matches with swapped colors
    const matchedBlocks = findMatches(swappedGrid);
    
    if (matchedBlocks.length > 0) {
      // We have matches! Update moves count
      setMovesCount(prev => prev + 1);
      
      // Flatten match positions for easier checking
      const matchedPositions = matchedBlocks.flat();
      
      // Create a new grid where:
      // 1. Swapped blocks that are in a match keep their direction (so they don't animate back)
      // 2. Swapped blocks that are not in a match need to clear their direction so they don't keep moving
      // 3. Mark all matched blocks
      const gridWithMatches = swappedGrid.map((block, index) => {
        // Check if this block is part of a match
        const isMatched = matchedPositions.some(mb => mb.row === block.row && mb.col === block.col);
        
        if (index === index1 || index === index2) {
          // This is one of the swapped blocks
          return {
            ...block,
            // Only clear swapDirection if not matched, to prevent moving back
            swapDirection: isMatched ? block.swapDirection : null,
            matched: isMatched
          };
        }
        
        return {
          ...block,
          matched: isMatched
        };
      });
      
      setGrid(gridWithMatches);
      
      // Wait for match animation
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Process matches (clear and apply gravity)
      await processMatches(gridWithMatches, matchedBlocks);
    } else {
      // No matches, swap back - add reverse direction
      const swapBackGrid = swappedGrid.map((block, index) => {
        if (index === index1) {
          return { 
            ...block, 
            swapDirection: direction2,   // Reverse direction
            colorIndex: grid[index1].colorIndex  // Restore original color
          };
        } else if (index === index2) {
          return { 
            ...block, 
            swapDirection: direction1,   // Reverse direction
            colorIndex: grid[index2].colorIndex  // Restore original color
          };
        }
        return block;
      });
      
      setGrid(swapBackGrid);
      
      // Wait for animation to complete
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Reset the grid - clear swap directions but keep original colors
      const resetGrid = swapBackGrid.map((block, index) => {
        if (index === index1 || index === index2) {
          return {
            ...block,
            swapDirection: null  // Just clear the animation direction
          };
        }
        return block;
      });
      
      setGrid(resetGrid);
    }
    
    animationInProgress.current = false;
    setIsAnimating(false);
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
  
  // Process matched blocks - clear and apply gravity
  const processMatches = async (currentGrid, matches) => {
    // Calculate score (10 points per block, with multiplier for more blocks)
    const matchScore = matches.length * 10 * (1 + (matches.length - 3) * 0.1);
    setScore(prev => {
      const newScore = prev + matchScore;
      if (onScoreUpdate) onScoreUpdate(newScore);
      return newScore;
    });
    
    // Get flat list of all matched positions
    const matchedPositions = matches.flat();
    
    // Clear matched blocks (mark them as empty)
    const clearedGrid = currentGrid.map(block => {
      if (matchedPositions.some(m => m.row === block.row && m.col === block.col)) {
        return { 
          ...block, 
          colorIndex: -1,   // Mark as empty
          matched: false    // Reset matched state
        };
      }
      return block;
    });
    
    setGrid(clearedGrid);
    
    // Allow time for match clear animation
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Apply gravity (move blocks down to fill empty spaces)
    // We'll use a 2D approach for clarity
    
    // First convert to 2D grid for easier processing
    let grid2D = Array(rows).fill().map(() => Array(rows).fill(null));
    
    // Fill the 2D grid with current blocks
    clearedGrid.forEach(block => {
      if (block.row >= 0 && block.row < rows && block.col >= 0 && block.col < rows) {
        grid2D[block.row][block.col] = block;
      }
    });
    
    // Apply gravity column by column
    let newGrid = [];
    
    for (let col = 0; col < rows; col++) {
      // Count empty spaces and collect blocks in this column
      let emptySpaces = 0;
      let colBlocks = [];
      
      // Go from bottom to top
      for (let row = rows - 1; row >= 0; row--) {
        const block = grid2D[row][col];
        
        if (!block || block.colorIndex === -1) {
          // Count empty spaces
          emptySpaces++;
        } else {
          // This is a non-empty block that needs to be kept
          colBlocks.push(block);
        }
      }
      
      // Now redistribute the blocks from bottom to top
      let currentRow = rows - 1;
      
      // Place existing blocks first
      colBlocks.forEach(block => {
        newGrid.push({
          ...block,
          row: currentRow,  // New row position
          col: col          // Column stays the same
        });
        currentRow--;
      });
      
      // Then fill empty spaces at the top with new blocks
      for (let i = 0; i < emptySpaces; i++) {
        newGrid.push({
          id: `${currentRow}_${col}_new`, // New unique ID
          row: currentRow,
          col: col,
          colorIndex: Math.floor(Math.random() * colors.length),
          selected: false,
          matched: false,
          isNew: true,
          swapDirection: null
        });
        currentRow--;
      }
    }
    
    // Update the grid with blocks that have their new positions
    setGrid(newGrid);
    
    // Allow time for blocks to fall and new blocks to appear
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Reset isNew flag
    const resetGrid = newGrid.map(block => ({
      ...block,
      isNew: false,
    }));
    
    setGrid(resetGrid);
    
    // Check for cascading matches
    const cascadeMatches = findMatches(resetGrid);
    if (cascadeMatches.length > 0) {
      // Get flat list of all matched positions
      const matchedPositions = cascadeMatches.flat();
      
      // Process cascading matches - mark blocks as matched
      const gridWithCascadeMatches = resetGrid.map(block => ({
        ...block,
        matched: matchedPositions.some(mb => mb.row === block.row && mb.col === block.col),
      }));
      
      setGrid(gridWithCascadeMatches);
      
      // Wait for match animation
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Recursively process matches
      await processMatches(gridWithCascadeMatches, cascadeMatches);
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