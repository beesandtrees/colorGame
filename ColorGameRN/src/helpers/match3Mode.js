import { rand } from './helpers';
import { colorArrays, MATCH3_MODE } from './constants';

// Create level configuration for Match 3 Mode
export function createMatch3Level(level) {
  // Start with a reasonable level
  level = Math.max(1, level);
  
  // Level parameters increase with difficulty
  const baseSize = 8; // Start with 8x8 grid (increased from 6x6)
  const baseColors = 4; // Start with 4 colors
  
  // Board size stays fixed at 8x8 for all levels
  const size = baseSize;
  
  // Number of colors increases with level
  const colors = Math.min(6, baseColors + Math.floor(level / 4));
  
  // Number of moves allowed - based on constants
  const moveLimit = MATCH3_MODE.BASE_MOVE_LIMIT + (level - 1) * MATCH3_MODE.MOVE_INCREASE_PER_LEVEL;
  
  // Match goal - number of matches required to advance to the next level
  const matchGoal = MATCH3_MODE.BASE_MATCH_GOAL + (level - 1) * MATCH3_MODE.MATCHES_INCREASE_PER_LEVEL;
  
  console.log(`Level ${level} configuration: ${size}x${size} grid, ${colors} colors, ${matchGoal} matches goal, ${moveLimit} moves limit`);
  
  return {
    size,
    numberofrows: size,
    numberofcolors: colors,
    colorscheme: level % 5, // Cycle through color schemes
    moveLimit,
    matchGoal, // Number of matches needed to complete this level
    matchesMade: 0, // Track number of matches made (starts at 0)
    level
  };
}

// Generate a random Match 3 grid with no initial matches but with potential moves
export function generateMatch3Grid(rows, colors) {
  let grid = [];
  let isValid = false;
  let attempts = 0;
  const MAX_ATTEMPTS = 100; // Avoid infinite loops
  const MIN_POTENTIAL_MATCHES = 8; // Ensure there are enough potential moves (increased from 5)
  
  // Create grid without matches by checking each position as we fill it
  function generateNoMatchGrid(rows, colors) {
    const grid = [];
    
    // Initialize empty grid
    for (let i = 0; i < rows; i++) {
      grid[i] = [];
      for (let j = 0; j < rows; j++) {
        grid[i][j] = {
          color: -1, // Start with -1 to indicate not filled yet
          selected: false,
          matched: false
        };
      }
    }
    
    // Fill grid with colors that don't create matches
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < rows; j++) {
        // Get colors to avoid (colors that would create a match)
        const avoidColors = getColorsToAvoid(grid, i, j, rows);
        
        // Get available colors (all colors except the ones to avoid)
        const availableColors = [];
        for (let c = 0; c < colors; c++) {
          if (!avoidColors.includes(c)) {
            availableColors.push(c);
          }
        }
        
        // If no available colors, we need to break a constraint
        // This should be rare, but can happen
        if (availableColors.length === 0) {
          // Just use a random color as a fallback
          grid[i][j].color = Math.floor(Math.random() * colors);
        } else {
          // Pick a random color from available colors
          const randIndex = Math.floor(Math.random() * availableColors.length);
          grid[i][j].color = availableColors[randIndex];
        }
      }
    }
    
    return grid;
  }
  
  // Helper function to get colors that would create a match at position (row, col)
  function getColorsToAvoid(grid, row, col, rows) {
    const avoidColors = [];
    
    // HORIZONTAL CASES
    
    // Case 1: Two to the left
    if (col >= 2) {
      // If the two blocks to the left have the same color, avoid that color
      if (grid[row][col-1].color === grid[row][col-2].color && grid[row][col-1].color !== -1) {
        avoidColors.push(grid[row][col-1].color);
      }
    }
    
    // Case 2: One to the left and one to the right
    if (col >= 1 && col < rows - 1) {
      // If the block to the left and the one to the right have the same color, avoid that color
      if (grid[row][col-1].color === grid[row][col+1].color && grid[row][col-1].color !== -1) {
        avoidColors.push(grid[row][col-1].color);
      }
    }
    
    // Case 3: Two to the right (checking ahead for values not yet filled)
    if (col < rows - 2 && grid[row][col+1].color !== -1 && grid[row][col+2].color !== -1) {
      // If the two blocks to the right have the same color, avoid that color
      if (grid[row][col+1].color === grid[row][col+2].color) {
        avoidColors.push(grid[row][col+1].color);
      }
    }
    
    // VERTICAL CASES
    
    // Case 1: Two above
    if (row >= 2) {
      // If the two blocks above have the same color, avoid that color
      if (grid[row-1][col].color === grid[row-2][col].color && grid[row-1][col].color !== -1) {
        avoidColors.push(grid[row-1][col].color);
      }
    }
    
    // Case 2: One above and one below
    if (row >= 1 && row < rows - 1) {
      // If the block above and below have the same color, avoid that color
      if (grid[row-1][col].color === grid[row+1][col].color && grid[row-1][col].color !== -1 && grid[row+1][col].color !== -1) {
        avoidColors.push(grid[row-1][col].color);
      }
    }
    
    // Case 3: Two below (checking ahead for values not yet filled)
    if (row < rows - 2 && grid[row+1][col].color !== -1 && grid[row+2][col].color !== -1) {
      // If the two blocks below have the same color, avoid that color
      if (grid[row+1][col].color === grid[row+2][col].color) {
        avoidColors.push(grid[row+1][col].color);
      }
    }
    
    // ADDITIONAL DIAGONAL/SPECIAL CASES
    
    // If we're in a "middle" position of a potential match
    // Check if placing a color would create a pattern like: X _ X where _ is current position
    
    // Horizontal gap case (check if same color is two positions away on either side)
    if (col >= 2 && col < rows - 2) {
      // Check if two spaces away on both sides have the same color
      if (grid[row][col-2].color === grid[row][col+2].color && grid[row][col-2].color !== -1) {
        avoidColors.push(grid[row][col-2].color);
      }
    }
    
    // Vertical gap case (check if same color is two positions away on top/bottom)
    if (row >= 2 && row < rows - 2) {
      // Check if two spaces away on top and bottom have the same color
      if (grid[row-2][col].color === grid[row+2][col].color && grid[row-2][col].color !== -1) {
        avoidColors.push(grid[row-2][col].color);
      }
    }
    
    // Return array of colors to avoid
    return [...new Set(avoidColors)]; // Remove duplicates
  }
  
  // Keep generating grids until we find one with no matches and enough potential moves
  while (!isValid && attempts < MAX_ATTEMPTS) {
    attempts++;
    console.log(`Attempt ${attempts} to generate valid grid`);
    
    // Create a new grid with no initial matches
    grid = generateNoMatchGrid(rows, colors);
    
    // Double check that the grid has no matches
    const matches = checkMatches(grid, rows, rows);
    
    if (matches.length > 0) {
      console.log(`Warning: Generated grid still has ${matches.length} matches. Regenerating...`);
      continue;
    }
    
    // Check for potential matches
    const potentialMatches = checkPotentialMatches(grid, rows, rows);
    
    // If enough potential matches, the grid is valid
    if (potentialMatches.length >= MIN_POTENTIAL_MATCHES) {
      isValid = true;
      console.log(`Generated a valid starting grid with no matches and ${potentialMatches.length} potential moves`);
    } else {
      console.log(`Grid had only ${potentialMatches.length} potential moves, need at least ${MIN_POTENTIAL_MATCHES}, regenerating...`);
    }
  }
  
  // If we couldn't generate a valid grid after MAX_ATTEMPTS, just use the last one
  if (!isValid) {
    console.log(`Could not generate an ideal grid after ${MAX_ATTEMPTS} attempts, using last attempt`);
  }
  
  return grid;
}

// Check if two blocks are adjacent
export function areAdjacent(row1, col1, row2, col2) {
  // Same row, adjacent columns
  if (row1 === row2 && Math.abs(col1 - col2) === 1) {
    return true;
  }
  
  // Same column, adjacent rows
  if (col1 === col2 && Math.abs(row1 - row2) === 1) {
    return true;
  }
  
  return false;
}

// Swap two blocks in the grid
export function swapBlocks(grid, row1, col1, row2, col2) {
  // Clone the grid to avoid direct state mutation
  const newGrid = JSON.parse(JSON.stringify(grid));
  
  // Check if blocks are adjacent
  if (!areAdjacent(row1, col1, row2, col2)) {
    console.log("Blocks are not adjacent, can't swap");
    return grid; // Return the original grid unchanged
  }
  
  // Make sure the coordinates are valid
  if (
    row1 < 0 || row1 >= grid.length || 
    col1 < 0 || col1 >= grid[0].length || 
    row2 < 0 || row2 >= grid.length || 
    col2 < 0 || col2 >= grid[0].length
  ) {
    console.log("Invalid coordinates for swap");
    return grid; // Return the original grid unchanged
  }
  
  try {
    // Swap the blocks - only swap the color property, keep other properties
    const tempColor = newGrid[row1][col1].color;
    newGrid[row1][col1].color = newGrid[row2][col2].color;
    newGrid[row2][col2].color = tempColor;
    
    // Reset selection state for both blocks
    newGrid[row1][col1].selected = false;
    newGrid[row2][col2].selected = false;
    
    // CRITICAL FIX: INSTEAD of just marking wasSwapped, create an ENTIRELY NEW block
    // with its own unique ID to ensure it's treated as a separate entity
    
    // Create new block 1 with swap tracking
    newGrid[row1][col1] = {
      ...newGrid[row1][col1],
      wasSwapped: true,
      originalPosition: { row: row1, col: col1 },
      finalPosition: { row: row1, col: col1 },
      swapPartner: { row: row2, col: col2 },
      swappedBlockId: `swapped-block-${row1}-${col1}-${Date.now()}`
    };
    
    // Create new block 2 with swap tracking
    newGrid[row2][col2] = {
      ...newGrid[row2][col2],
      wasSwapped: true,
      originalPosition: { row: row2, col: col2 },
      finalPosition: { row: row2, col: col2 },
      swapPartner: { row: row1, col: col1 },
      swappedBlockId: `swapped-block-${row2}-${col2}-${Date.now()}`
    };
    
    console.log(`SWAP: Created entirely new blocks at [${row1},${col1}] and [${row2},${col2}] with unique IDs`);
    
    return newGrid;
  } catch (error) {
    console.error("Error during swap:", error);
    return grid; // Return the original grid unchanged
  }
}

// Check for matches in the grid (3 or more in a row/column)
export function checkMatches(grid, numRows, numCols) {
  // Deep clone the grid to avoid modifications
  const gridCopy = JSON.parse(JSON.stringify(grid));
  const matches = [];
  const minMatchSize = MATCH3_MODE.MIN_MATCH_LENGTH;

  // SIMPLIFIED MATCHING ALGORITHM FOR DEBUGGING
  
  // Check horizontal matches - simpler version
  for (let row = 0; row < numRows; row++) {
    // For each row, find all horizontal matches of 3 or more
    for (let col = 0; col <= numCols - minMatchSize; col++) {
      // Get the color at current position
      const currentColor = gridCopy[row][col].color;
      
      // Skip empty cells or invalid colors
      if (currentColor === -1 || currentColor === undefined) continue;
      
      // Check if next cells have the same color - keep checking even beyond 3
      let matchLength = 1;
      // Continue checking as far as possible, not just minMatchSize
      for (let k = 1; k < numCols - col; k++) {
        if (gridCopy[row][col + k].color === currentColor) {
          matchLength++;
        } else {
          break;
        }
      }
      
      // If we have a match of at least minMatchSize
      if (matchLength >= minMatchSize) {
        const match = [];
        
        for (let k = 0; k < matchLength; k++) {
          match.push({ row, col: col + k });
        }
        matches.push(match);
        
        // Skip ahead past this match
        col += matchLength - 1;
      }
    }
  }
  
  // Check vertical matches - simpler version
  for (let col = 0; col < numCols; col++) {
    // For each column, find all vertical matches of 3 or more
    for (let row = 0; row <= numRows - minMatchSize; row++) {
      // Get the color at current position
      const currentColor = gridCopy[row][col].color;
      
      // Skip empty cells or invalid colors
      if (currentColor === -1 || currentColor === undefined) continue;
      
      // Check if next cells have the same color - keep checking even beyond 3
      let matchLength = 1;
      // Continue checking as far as possible, not just minMatchSize
      for (let k = 1; k < numRows - row; k++) {
        if (gridCopy[row + k][col].color === currentColor) {
          matchLength++;
        } else {
          break;
        }
      }
      
      // If we have a match of at least minMatchSize
      if (matchLength >= minMatchSize) {
        const match = [];
        
        for (let k = 0; k < matchLength; k++) {
          match.push({ row: row + k, col });
        }
        matches.push(match);
        
        // Skip ahead past this match
        row += matchLength - 1;
      }
    }
  }
  
  return matches;
}

// Check for potential matches (for highlighting)
export function checkPotentialMatches(grid, numRows, numCols) {
  const potentialMatches = [];
  
  // Look for situations where a swap would create a match
  for (let row = 0; row < numRows; row++) {
    for (let col = 0; col < numCols; col++) {
      // Skip empty cells
      if (grid[row][col].color === -1) continue;
      
      // Check horizontal swaps
      if (col < numCols - 1) {
        // Try swapping with right neighbor
        const tempGrid = JSON.parse(JSON.stringify(grid));
        const temp = tempGrid[row][col].color;
        tempGrid[row][col].color = tempGrid[row][col+1].color;
        tempGrid[row][col+1].color = temp;
        
        // Check for matches after swap
        const matches = checkMatches(tempGrid, numRows, numCols);
        if (matches.length > 0) {
          potentialMatches.push({row, col, direction: 'right'});
        }
      }
      
      // Check vertical swaps
      if (row < numRows - 1) {
        // Try swapping with below neighbor
        const tempGrid = JSON.parse(JSON.stringify(grid));
        const temp = tempGrid[row][col].color;
        tempGrid[row][col].color = tempGrid[row+1][col].color;
        tempGrid[row+1][col].color = temp;
        
        // Check for matches after swap
        const matches = checkMatches(tempGrid, numRows, numCols);
        if (matches.length > 0) {
          potentialMatches.push({row, col, direction: 'down'});
        }
      }
    }
  }
  
  return potentialMatches;
}

// Apply gravity to make blocks fall into empty spaces
export function applyGravity(grid, numRows, numCols) {
  // Clone the grid
  const newGrid = JSON.parse(JSON.stringify(grid));
  
  console.log("BEFORE GRAVITY - Grid structure:", 
    JSON.stringify(grid.map(row => row.map(cell => cell.color))));
  
  // RADICALLY SIMPLIFIED GRAVITY ALGORITHM TO FIX DISAPPEARING DOTS
  // Process each column separately with focused logic to avoid bugs
  for (let col = 0; col < numCols; col++) {
    console.log(`Applying gravity to column ${col}`);
    
    // Step 1: First IDENTIFY all non-empty blocks in the column to track what we have
    const blockMap = [];
    for (let row = 0; row < numRows; row++) {
      if (!newGrid[row][col].isEmpty && newGrid[row][col].color !== -1) {
        // Store full information about each block
        blockMap.push({
          ...newGrid[row][col],
          position: { row, col }  // Store current position for tracking
        });
        
        console.log(`Column ${col}: Found block at [${row},${col}], color ${newGrid[row][col].color}, wasSwapped: ${newGrid[row][col].wasSwapped || false}, wasMatched: ${newGrid[row][col].wasMatched || false}`);
      }
    }
    
    // Step 2: TEMPORARILY save column for safety
    const originalColumn = [];
    for (let row = 0; row < numRows; row++) {
      originalColumn[row] = { ...newGrid[row][col] };
    }
    
    // Step 3: Reset the column to all empty
    for (let row = 0; row < numRows; row++) {
      newGrid[row][col] = {
        color: -1,
        isEmpty: true,
        matched: false,
        selected: false,
        needsNewBlock: true // Mark for new block addition by default
      };
    }
    
    // Step 4: Process ONLY SURVIVING blocks (non-matched) from bottom to top
    // First identify surviving blocks that need to be repositioned
    const survivingBlocks = blockMap.filter(block => !block.wasMatched && !block.matched);
    console.log(`Column ${col}: Found ${survivingBlocks.length} surviving blocks out of ${blockMap.length} total`);
    
    // Start from the bottom of the grid, placing surviving blocks
    let currentRow = numRows - 1;
    const placedBlocks = [];
    
    // Process each surviving block from bottom to top
    survivingBlocks.forEach(block => {
      const { position, ...blockProps } = block;
      const blockId = block.swappedBlockId || `block-${position.row}-${position.col}`;
      
      // If this is a swapped block, keep it at its exact position
      if (block.wasSwapped) {
        console.log(`Column ${col}: Found swapped block at [${position.row},${position.col}] with ID ${blockId}`);
        
        // Place the swapped block at its EXACT original position, never moving it
        newGrid[position.row][position.col] = {
          ...blockProps,
          position: position,
          moved: false,
          falling: false,
          needsNewBlock: false,
          uniqueId: blockId
        };
        
        // Record that we've placed this block
        placedBlocks.push({
          row: position.row,
          col: position.col,
          id: blockId
        });
        
        console.log(`Column ${col}: Preserved swapped block at [${position.row},${position.col}] with ID ${blockId}`);
      }
    });
    
    // Now fill remaining positions from bottom up with non-swapped surviving blocks
    let filledCount = 0;
    
    // Get non-swapped blocks to place
    const regularBlocks = survivingBlocks.filter(block => !block.wasSwapped);
    
    // Fill from bottom up, skipping positions where swapped blocks already exist
    while (regularBlocks.length > 0 && currentRow >= 0) {
      // Check if this position already has a block from the swapped blocks step
      const alreadyOccupied = placedBlocks.some(placed => 
        placed.row === currentRow && placed.col === col
      );
      
      if (alreadyOccupied) {
        console.log(`Column ${col}: Position [${currentRow},${col}] already has a block, skipping`);
        currentRow--;
        continue;
      }
      
      // Take the lowest block first (for better visual appearance)
      const lowestBlockIndex = regularBlocks.reduce((lowestIdx, block, idx) => {
        if (lowestIdx === -1 || block.position.row > regularBlocks[lowestIdx].position.row) {
          return idx;
        }
        return lowestIdx;
      }, -1);
      
      const nextBlock = regularBlocks.splice(lowestBlockIndex, 1)[0];
      const originalPosition = nextBlock.position;
      const { position, ...blockProps } = nextBlock;
      
      // Generate a unique ID for this block for tracking
      const blockId = `regular-${originalPosition.row}-${originalPosition.col}-${Date.now()}`;
      
      console.log(`Column ${col}: Moving block from [${originalPosition.row},${originalPosition.col}] to [${currentRow},${col}] with ID ${blockId}`);
      
      // Create a completely new block object to avoid reference issues
      newGrid[currentRow][col] = {
        ...blockProps,
        moved: originalPosition.row !== currentRow,
        falling: originalPosition.row !== currentRow,
        originalRow: originalPosition.row,
        needsNewBlock: false,
        uniqueId: blockId
      };
      
      filledCount++;
      currentRow--;
    }
    
    // Any empty positions at the top will get new blocks
    let emptySpaces = 0;
    for (let row = 0; row < numRows; row++) {
      if (newGrid[row][col].needsNewBlock) {
        emptySpaces++;
      }
    }
    
    console.log(`Column ${col}: Placed ${filledCount} blocks, left ${emptySpaces} empty spaces for new blocks`);
  }
  
  console.log("AFTER GRAVITY - Grid structure:", 
    JSON.stringify(newGrid.map(row => row.map(cell => cell.color))));
  
  return newGrid;
}

// Add new blocks to fill empty cells at the top of the grid
export function addNewBlocks(grid, numRows, numCols, numColors) {
  // Clone the grid
  const newGrid = JSON.parse(JSON.stringify(grid));
  
  console.log("BEFORE ADDING NEW BLOCKS - Grid structure:", 
    JSON.stringify(newGrid.map(row => row.map(cell => cell.color))));
  
  // Step 1: First count how many empty cells need new blocks in each column
  const emptyCountByColumn = {};
  for (let col = 0; col < numCols; col++) {
    emptyCountByColumn[col] = 0;
    for (let row = 0; row < numRows; row++) {
      if ((newGrid[row][col].color === -1 || newGrid[row][col].isEmpty) && 
          !newGrid[row][col].wasSwapped) { // Skip positions with swapped blocks
        emptyCountByColumn[col]++;
      }
    }
    console.log(`Column ${col} needs ${emptyCountByColumn[col]} new blocks`);
  }
  
  // Step 2: Add new blocks to empty cells, focusing on cells marked as needsNewBlock
  let totalNewBlocks = 0;
  for (let col = 0; col < numCols; col++) {
    let newBlocksAdded = 0;
    for (let row = 0; row < numRows; row++) {
      // Only add a new block if:
      // 1. The cell is empty
      // 2. It's not a position with a swapped block (those should be preserved)
      // 3. It's either explicitly marked as needing a new block OR we haven't filled all empty spaces yet
      if ((newGrid[row][col].color === -1 || newGrid[row][col].isEmpty) && 
          !newGrid[row][col].wasSwapped &&
          (newGrid[row][col].needsNewBlock || newGrid[row][col].wasWhiteSpace)) {
        
        // Generate a random color for the new block
        const newColor = Math.floor(Math.random() * numColors);
        
        console.log(`Adding new block at [${row},${col}] with color ${newColor}`);
        
        // Create a new block with isNew flag and unique ID
        newGrid[row][col] = {
          color: newColor,
          matched: false,
          selected: false,
          isEmpty: false,
          isNew: true, // Mark as new for animation
          id: `new-${row}-${col}-${Date.now()}`, // Add unique ID for tracking
          fromColumn: col // Track which column this block belongs to
        };
        
        newBlocksAdded++;
        totalNewBlocks++;
      }
    }
    
    console.log(`Added ${newBlocksAdded} new blocks to column ${col}`);
    
    // Verify we added the right number of blocks
    if (newBlocksAdded !== emptyCountByColumn[col]) {
      console.warn(`Warning: Column ${col} needed ${emptyCountByColumn[col]} blocks but added ${newBlocksAdded}`);
    }
  }
  
  console.log(`Total new blocks added: ${totalNewBlocks}`);
  
  // Final validation: Make sure we don't have any empty cells left
  let remainingEmpty = 0;
  for (let row = 0; row < numRows; row++) {
    for (let col = 0; col < numCols; col++) {
      if ((newGrid[row][col].color === -1 || newGrid[row][col].isEmpty) && 
          !newGrid[row][col].wasSwapped) {
        console.warn(`Warning: Cell at [${row},${col}] is still empty after adding new blocks!`);
        remainingEmpty++;
        
        // Emergency fix - fill it with a random block
        const emergencyColor = Math.floor(Math.random() * numColors);
        newGrid[row][col] = {
          color: emergencyColor,
          matched: false,
          selected: false,
          isEmpty: false,
          isNew: true,
          isEmergencyBlock: true, // Mark it specially
          id: `emergency-${row}-${col}-${Date.now()}`
        };
      }
    }
  }
  
  if (remainingEmpty > 0) {
    console.warn(`Had to add ${remainingEmpty} emergency blocks to fill remaining empty cells`);
  }
  
  console.log("AFTER ADDING NEW BLOCKS - Grid structure:", 
    JSON.stringify(newGrid.map(row => row.map(cell => cell.color))));
  
  return newGrid;
}

// Remove matches, apply gravity, and add new blocks
export function removeMatches(grid, matches, numRows, numCols, numColors) {
  // Clone the grid
  const newGrid = JSON.parse(JSON.stringify(grid));
  
  // Print the grid coordinates for reference
  console.log("Grid coordinates reference:");
  for (let i = 0; i < numRows; i++) {
    let rowStr = "";
    for (let j = 0; j < numCols; j++) {
      rowStr += `[${i},${j}]=${grid[i][j].color} `;
    }
    console.log(rowStr);
  }
  
  console.log("BEFORE MATCH - Grid structure:", 
    JSON.stringify(grid.map(row => row.map(cell => cell.color))));
  
  // Create a list of all matched positions for easy lookup
  const matchedPositions = [];
  matches.forEach(match => {
    match.forEach(pos => {
      matchedPositions.push(pos);
    });
  });
  
  console.log(`Total matched positions: ${matchedPositions.length}`);
  
  // Track which blocks were part of a recent swap and are matched
  const swappedMatchedBlocks = [];
  
  // Before processing matches, mark which blocks are involved in swaps and matches
  matches.forEach(match => {
    match.forEach(pos => {
      if (newGrid[pos.row] && newGrid[pos.row][pos.col] && newGrid[pos.row][pos.col].wasSwapped) {
        console.log(`⚠️ PRE-MARKING: Swapped block at [${pos.row},${pos.col}] will be matched`);
        
        // Mark the block as both swapped and matched
        newGrid[pos.row][pos.col].wasMatched = true;
        
        // If this block has a swap partner, mark the relationship
        if (newGrid[pos.row][pos.col].swapPartner) {
          const partner = newGrid[pos.row][pos.col].swapPartner;
          console.log(`Found swap partner at [${partner.row},${partner.col}]`);
          
          // Check if the partner exists
          if (newGrid[partner.row] && newGrid[partner.row][partner.col]) {
            // Mark the partner with a special flag to indicate its partner was matched
            newGrid[partner.row][partner.col].partnerWasMatched = true;
          }
        }
      }
    });
  });
  
  // Now mark matched cells as empty
  matches.forEach((match, matchIndex) => {
    console.log(`Applying match ${matchIndex+1} (${match.length} blocks):`);
    match.forEach(pos => {
      if (newGrid[pos.row] && newGrid[pos.row][pos.col]) {
        // Check if this block was recently swapped
        if (newGrid[pos.row][pos.col].wasSwapped) {
          console.log(`⚠️ CRITICAL: Swapped block at [${pos.row},${pos.col}] is part of a match!`);
          swappedMatchedBlocks.push({
            row: pos.row,
            col: pos.col,
            swapPartner: newGrid[pos.row][pos.col].swapPartner,
            isSourceBlock: true
          });
          
          // If this block has a partner, store that too
          if (newGrid[pos.row][pos.col].swapPartner) {
            const partner = newGrid[pos.row][pos.col].swapPartner;
            swappedMatchedBlocks.push({
              row: partner.row,
              col: partner.col,
              swapPartner: { row: pos.row, col: pos.col },
              isPartnerBlock: true
            });
          }
        }
        
        console.log(`  - Removing block at [${pos.row},${pos.col}] with color ${newGrid[pos.row][pos.col].color}`);
        
        // Store information about whether this block was swapped
        const wasSwapped = newGrid[pos.row][pos.col].wasSwapped || false;
        const swapPartner = newGrid[pos.row][pos.col].swapPartner || null;
        
        // Mark cell as empty with a special visual state for debugging
        newGrid[pos.row][pos.col] = {
          color: -1, // -1 indicates empty
          matched: true,
          isNew: false,
          selected: false,
          isEmpty: true, // New flag to indicate empty for rendering
          wasMatched: true, // Indicate this was a matched position
          matchedTime: Date.now(), // Add timestamp for staggered animation
          // Keep swap information for the gravity algorithm
          wasSwapped: wasSwapped,
          swapPartner: swapPartner
        };
      }
    });
  });
  
  console.log("AFTER MATCH - Grid with empty cells:", 
    JSON.stringify(newGrid.map(row => row.map(cell => cell.color))));
  
  // Clear all wasSwapped flags from the grid before applying gravity
  for (let row = 0; row < numRows; row++) {
    for (let col = 0; col < numCols; col++) {
      if (newGrid[row][col].wasSwapped) {
        console.log(`Clearing wasSwapped flag at [${row},${col}]`);
        delete newGrid[row][col].wasSwapped;
        delete newGrid[row][col].swapPartner;
      }
    }
  }
  
  // Apply gravity to make blocks fall into empty spaces using improved algorithm
  const gridWithGravity = applyGravity(newGrid, numRows, numCols);
  
  // Mark all falling blocks with unique timestamps for staggered animation
  for (let i = 0; i < numRows; i++) {
    for (let j = 0; j < numCols; j++) {
      if (gridWithGravity[i][j].falling) {
        gridWithGravity[i][j].fallingTime = Date.now() + (i * 50); // Stagger by row
      }
    }
  }
  
  // Add new blocks to fill empty spaces at the top
  // Use the provided number of colors or default to 4
  const numberOfColors = numColors || 4;
  const gridWithNewBlocks = addNewBlocks(gridWithGravity, numRows, numCols, numberOfColors);
  
  // Mark new blocks with unique timestamps for staggered animation
  let newBlockCount = 0;
  for (let i = 0; i < numRows; i++) {
    for (let j = 0; j < numCols; j++) {
      if (gridWithNewBlocks[i][j].isNew) {
        gridWithNewBlocks[i][j].newTime = Date.now() + (j * 50); // Stagger by column
        gridWithNewBlocks[i][j].id = `new-${i}-${j}-${Date.now()}`; // Add unique ID for tracking
        newBlockCount++;
      }
    }
  }
  console.log(`Added ${newBlockCount} new blocks with unique IDs`);
  
  return gridWithNewBlocks;
}

// Process a single step of cascading matches
export function processNextCascade(grid, numRows, numCols, numColors) {
  // Clone the grid
  const currentGrid = JSON.parse(JSON.stringify(grid));
  
  // Check for matches in the current grid
  const matches = checkMatches(currentGrid, numRows, numCols);
  
  // If no matches, return null to indicate we're done
  if (matches.length === 0) {
    console.log("No more cascading matches found");
    return {
      hasMatches: false,
      grid: currentGrid,
      score: 0,
      matches: []
    };
  }
  
  console.log(`Found ${matches.length} cascading matches`);
  
  // Calculate score for this iteration
  const score = calculateScore(matches);
  console.log(`Cascade score: ${score}`);
  
  // Process the matches (remove matched blocks, apply gravity, add new blocks)
  const updatedGrid = removeMatches(currentGrid, matches, numRows, numCols, numColors);
  
  return {
    hasMatches: true,
    grid: updatedGrid,
    score: score,
    matches: matches
  };
}

// Calculate score based on matches
export function calculateScore(matches, cascadeMultiplier = 1.0, level = 1) {
  let score = 0;
  
  // Calculate level score multiplier (increases with level)
  const levelMultiplier = level > 1 ? 
    Math.pow(MATCH3_MODE.LEVEL_SCORE_MULTIPLIER, level - 1) : 1.0;
  
  matches.forEach(match => {
    // Base points for a minimum match
    const basePoints = MATCH3_MODE.BASE_POINTS;
    
    // Bonus points for longer matches
    const matchLength = match.length;
    const minMatchLength = MATCH3_MODE.MIN_MATCH_LENGTH;
    const bonusPerExtra = MATCH3_MODE.BONUS_POINTS_PER_EXTRA;
    
    // Calculate bonus for extra blocks beyond the minimum
    const lengthBonus = Math.max(0, (matchLength - minMatchLength) * bonusPerExtra);
    
    // Calculate the base score for this match
    const matchScore = basePoints + lengthBonus;
    
    // Apply cascade multiplier (higher for successive cascade matches)
    let finalScore = Math.floor(matchScore * cascadeMultiplier);
    
    // Apply level multiplier
    finalScore = Math.floor(finalScore * levelMultiplier);
    
    // Add to total score
    score += finalScore;
  });
  
  console.log(`Score calculation: base score: ${score}, level: ${level}, level multiplier: ${Math.pow(MATCH3_MODE.LEVEL_SCORE_MULTIPLIER, level - 1).toFixed(2)}x`);
  
  return score;
}

// Check if a move would create a match
export function checkPotentialMatch(grid, row1, col1, row2, col2, numRows, numCols) {
  // Clone the grid
  const testGrid = JSON.parse(JSON.stringify(grid));
  
  // Perform the swap
  const temp = testGrid[row1][col1];
  testGrid[row1][col1] = testGrid[row2][col2];
  testGrid[row2][col2] = temp;
  
  // Check for matches after the swap
  const matches = checkMatches(testGrid, numRows, numCols);
  
  return matches.length > 0;
}