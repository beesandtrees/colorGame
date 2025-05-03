import { rand } from './helpers';
import { colorArrays, PUZZLE_MODE } from './constants';

// Create level configuration for Puzzle Mode
export function createPuzzleLevel(level) {
  // Start with a reasonable level
  level = Math.max(1, level);
  
  // Level parameters increase with difficulty
  const baseSize = 4; // Start with 4x4 grid
  const baseColors = 4; // Start with 4 colors
  
  // Board size increases with level
  const size = Math.min(8, baseSize + Math.floor(level / 3));
  
  // Number of colors increases with level
  const colors = Math.min(6, baseColors + Math.floor(level / 4));
  
  // Number of moves allowed
  const moveLimit = Math.floor(size * size * 0.75);
  
  return {
    size,
    numberofrows: size,
    numberofcolors: colors,
    colorscheme: level % 5, // Cycle through color schemes
    moveLimit,
    level
  };
}

// Generate a random Puzzle grid
export function generatePuzzleGrid(rows, colors) {
  let grid = [];
  
  // Create the grid with random colors
  for (let i = 0; i < rows; i++) {
    grid[i] = [];
    for (let j = 0; j < rows; j++) {
      const color = Math.floor(Math.random() * colors);
      grid[i][j] = {
        color,
        selected: false,
        matched: false
      };
    }
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
  const minMatchSize = PUZZLE_MODE.MIN_MATCH_LENGTH;
  
  console.log("DEBUG - CHECKING MATCHES ON GRID:", 
    JSON.stringify(gridCopy.map(row => row.map(cell => cell.color))));
  
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
        
        // Include all cells in the match
        console.log(`Found horizontal match of ${matchLength} at row ${row}, cols ${col}-${col+matchLength-1}`);
        console.log(`  Colors: ${new Array(matchLength).fill(0).map((_, i) => gridCopy[row][col+i].color).join(',')}`);
        
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
        
        // Include all cells in the match
        console.log(`Found vertical match of ${matchLength} at col ${col}, rows ${row}-${row+matchLength-1}`);
        console.log(`  Colors: ${new Array(matchLength).fill(0).map((_, i) => gridCopy[row+i][col].color).join(',')}`);
        
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
  
  // Process each column separately
  for (let col = 0; col < numCols; col++) {
    // Start from the bottom of the column and move up
    let emptyRow = -1;
    
    // First, find empty spaces from bottom to top
    for (let row = numRows - 1; row >= 0; row--) {
      if (newGrid[row][col].color === -1 || newGrid[row][col].isEmpty) {
        // If this is an empty space, remember it
        if (emptyRow === -1) {
          emptyRow = row;
        }
      } 
      else if (emptyRow !== -1) {
        // We found a non-empty block above an empty space
        console.log(`Moving block from [${row},${col}] to [${emptyRow},${col}]`);
        
        // Move this block down to the empty space
        newGrid[emptyRow][col] = {
          ...newGrid[row][col],
          falling: true // Mark it as falling for animation
        };
        
        // Mark the original position as empty
        newGrid[row][col] = {
          color: -1,
          isEmpty: true,
          matched: false,
          selected: false
        };
        
        // Update emptyRow to the space above the one we just filled
        emptyRow--;
      }
    }
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
  
  // Check each column for empty cells at the top
  for (let col = 0; col < numCols; col++) {
    for (let row = 0; row < numRows; row++) {
      // If there's an empty cell, fill it with a new random block
      if (newGrid[row][col].color === -1 || newGrid[row][col].isEmpty) {
        // Generate a random color for the new block
        const newColor = Math.floor(Math.random() * numColors);
        
        console.log(`Adding new block at [${row},${col}] with color ${newColor}`);
        
        // Create a new block with the isNew flag for visual feedback
        newGrid[row][col] = {
          color: newColor,
          matched: false,
          selected: false,
          isEmpty: false,
          isNew: true // Mark as new for animation
        };
      }
    }
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
  
  // Mark matched cells as empty
  matches.forEach((match, matchIndex) => {
    console.log(`Applying match ${matchIndex+1} (${match.length} blocks):`);
    match.forEach(pos => {
      if (newGrid[pos.row] && newGrid[pos.row][pos.col]) {
        console.log(`  - Removing block at [${pos.row},${pos.col}] with color ${newGrid[pos.row][pos.col].color}`);
        // Mark cell as empty with a special visual state for debugging
        newGrid[pos.row][pos.col] = {
          color: -1, // -1 indicates empty
          matched: true,
          isNew: false,
          selected: false,
          isEmpty: true, // New flag to indicate empty for rendering
          matchedTime: Date.now() // Add timestamp for staggered animation
        };
      }
    });
  });
  
  console.log("AFTER MATCH - Grid with empty cells:", 
    JSON.stringify(newGrid.map(row => row.map(cell => cell.color))));
  
  // Apply gravity to make blocks fall into empty spaces
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
  for (let i = 0; i < numRows; i++) {
    for (let j = 0; j < numCols; j++) {
      if (gridWithNewBlocks[i][j].isNew) {
        gridWithNewBlocks[i][j].newTime = Date.now() + (j * 50); // Stagger by column
      }
    }
  }
  
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
export function calculateScore(matches, cascadeMultiplier = 1.0) {
  let score = 0;
  
  matches.forEach(match => {
    // Base points for a minimum match
    const basePoints = PUZZLE_MODE.BASE_POINTS;
    
    // Bonus points for longer matches
    const matchLength = match.length;
    const minMatchLength = PUZZLE_MODE.MIN_MATCH_LENGTH;
    const bonusPerExtra = PUZZLE_MODE.BONUS_POINTS_PER_EXTRA;
    
    // Calculate bonus for extra blocks beyond the minimum
    const lengthBonus = Math.max(0, (matchLength - minMatchLength) * bonusPerExtra);
    
    // Calculate the base score for this match
    const matchScore = basePoints + lengthBonus;
    
    // Apply cascade multiplier (higher for successive cascade matches)
    const finalScore = Math.floor(matchScore * cascadeMultiplier);
    
    // Add to total score
    score += finalScore;
  });
  
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