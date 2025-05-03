import { rand, fisherYates } from './helpers';
import { colorArrays } from './constants';

// Create level configuration for Flow Mode
export function createFlowLevel(level) {
  // Start with a reasonable level number
  level = Math.max(1, level);
  
  // Level parameters increase with difficulty
  const baseSpeed = 3000; // Base block falling speed in ms (slower to start)
  const baseRows = 6;     // Fewer rows to start for easier gameplay
  const baseColors = 4;   // Start with fewer colors
  
  // Adjust difficulty based on level
  // Gradually increase speed as level increases
  const speed = Math.max(1000, baseSpeed - (level * 150)); 
  
  // Board size starts smaller and increases with level
  const rows = Math.min(8, baseRows + Math.floor(level / 4));
  
  // Gradually add more colors to increase difficulty
  const colors = Math.min(6, baseColors + Math.floor(level / 3));
  
  console.log(`Flow Mode Level ${level}: ${rows}x${rows} board, ${colors} colors, ${speed}ms speed`);
  
  return {
    speed,
    numberofrows: rows,
    numberofcolors: colors,
    colorscheme: level % 5, // Cycle through color schemes
    minMatch: 3,           // Minimum match length required
    level: level           // Current level number
  };
}

// Populate initial grid for Flow Mode
export function populateFlowGrid(rows, colors) {
  let grid = [];
  
  // Create the initial grid with empty bottom rows
  for (let i = 0; i < rows; i++) {
    grid[i] = [];
    for (let j = 0; j < rows; j++) {
      // Fill only top 3 rows with colors initially
      if (i < 3) {
        const color = rand(colors);
        grid[i][j] = {
          color,
          active: false,
          falling: true
        };
      } else {
        // Empty cells below
        grid[i][j] = {
          color: -1, // -1 indicates empty cell
          active: false,
          falling: false
        };
      }
    }
  }
  
  return grid;
}

// Generate a new row of blocks at the top
export function generateNewRow(width, colors) {
  const newRow = [];
  
  for (let j = 0; j < width; j++) {
    const color = rand(colors);
    newRow[j] = {
      color,
      active: false,
      falling: true
    };
  }
  
  return newRow;
}

// Move blocks down by one position
export function shiftBlocksDown(grid, numRows, numCols) {
  const newGrid = [];
  
  // Copy grid structure
  for (let i = 0; i < numRows; i++) {
    newGrid[i] = [];
    for (let j = 0; j < numCols; j++) {
      newGrid[i][j] = { ...grid[i][j] };
    }
  }
  
  // Move blocks down (from bottom to top to avoid overwriting)
  for (let i = numRows - 1; i > 0; i--) {
    for (let j = 0; j < numCols; j++) {
      if (grid[i-1][j].color !== -1) {
        newGrid[i][j] = { ...grid[i-1][j] };
      }
    }
  }
  
  // Add new row at top
  for (let j = 0; j < numCols; j++) {
    newGrid[0][j] = {
      color: rand(numCols),
      active: false,
      falling: true
    };
  }
  
  return newGrid;
}

// Process a swipe gesture
export function handleSwipe(direction, row, col, grid, numRows, numCols) {
  // Clone the grid to avoid direct state mutation
  const newGrid = JSON.parse(JSON.stringify(grid));
  
  console.log(`Handling swipe: ${direction} at row: ${row}, col: ${col}`);
  
  switch (direction) {
    case 'left':
      // Move all blocks in the row left one position (rotation)
      console.log(`Shifting row ${row} left`);
      // Save the leftmost item
      const leftTemp = newGrid[row][0];
      // Shift all other items left
      for (let j = 0; j < numCols - 1; j++) {
        newGrid[row][j] = newGrid[row][j+1];
      }
      // Place the saved item at the right end
      newGrid[row][numCols-1] = leftTemp;
      break;
      
    case 'right':
      // Move all blocks in the row right one position (rotation)
      console.log(`Shifting row ${row} right`);
      // Save the rightmost item
      const rightTemp = newGrid[row][numCols-1];
      // Shift all other items right
      for (let j = numCols - 1; j > 0; j--) {
        newGrid[row][j] = newGrid[row][j-1];
      }
      // Place the saved item at the left end
      newGrid[row][0] = rightTemp;
      break;
      
    case 'up':
      // Move all blocks in the column up one position (rotation)
      console.log(`Shifting column ${col} up`);
      // Save the topmost item
      const topTemp = newGrid[0][col];
      // Shift all other items up
      for (let i = 0; i < numRows - 1; i++) {
        newGrid[i][col] = newGrid[i+1][col];
      }
      // Place the saved item at the bottom
      newGrid[numRows-1][col] = topTemp;
      break;
      
    case 'down':
      // Move all blocks in the column down one position (rotation)
      console.log(`Shifting column ${col} down`);
      // Save the bottommost item
      const bottomTemp = newGrid[numRows-1][col];
      // Shift all other items down
      for (let i = numRows - 1; i > 0; i--) {
        newGrid[i][col] = newGrid[i-1][col];
      }
      // Place the saved item at the top
      newGrid[0][col] = bottomTemp;
      break;
  }
  
  return newGrid;
}

// Check for matches in the grid (3 or more of the same color)
export function checkMatches(grid, numRows, numCols) {
  const matches = [];
  const minMatchSize = 3;
  
  // Check horizontal matches
  for (let i = 0; i < numRows; i++) {
    let currentMatch = [];
    let currentColor = -1;
    
    for (let j = 0; j < numCols; j++) {
      if (grid[i][j].color === currentColor && grid[i][j].color !== -1) {
        currentMatch.push({row: i, col: j});
      } else {
        if (currentMatch.length >= minMatchSize) {
          matches.push([...currentMatch]);
        }
        currentMatch = [{row: i, col: j}];
        currentColor = grid[i][j].color;
      }
    }
    
    // Check for match at end of row
    if (currentMatch.length >= minMatchSize) {
      matches.push([...currentMatch]);
    }
  }
  
  // Check vertical matches
  for (let j = 0; j < numCols; j++) {
    let currentMatch = [];
    let currentColor = -1;
    
    for (let i = 0; i < numRows; i++) {
      if (grid[i][j].color === currentColor && grid[i][j].color !== -1) {
        currentMatch.push({row: i, col: j});
      } else {
        if (currentMatch.length >= minMatchSize) {
          matches.push([...currentMatch]);
        }
        currentMatch = [{row: i, col: j}];
        currentColor = grid[i][j].color;
      }
    }
    
    // Check for match at end of column
    if (currentMatch.length >= minMatchSize) {
      matches.push([...currentMatch]);
    }
  }
  
  return matches;
}

// Remove matched blocks and collapse the grid
export function removeMatches(grid, matches, numRows, numCols) {
  const newGrid = JSON.parse(JSON.stringify(grid));
  
  // Mark matched blocks as empty
  matches.forEach(match => {
    match.forEach(pos => {
      newGrid[pos.row][pos.col] = {
        color: -1,
        active: false,
        falling: false
      };
    });
  });
  
  // Collapse grid - move blocks down to fill empty spaces
  for (let j = 0; j < numCols; j++) {
    let emptySpaces = 0;
    
    // Process column from bottom to top
    for (let i = numRows - 1; i >= 0; i--) {
      if (newGrid[i][j].color === -1) {
        emptySpaces++;
      } else if (emptySpaces > 0) {
        // Move block down by the number of empty spaces
        newGrid[i + emptySpaces][j] = newGrid[i][j];
        newGrid[i][j] = {
          color: -1,
          active: false,
          falling: false
        };
      }
    }
  }
  
  return newGrid;
}

// Calculate score for matches
export function calculateScore(matches) {
  let score = 0;
  
  matches.forEach(match => {
    // Base points per match
    const basePoints = 10;
    // Bonus for longer matches
    const lengthBonus = Math.pow(match.length - 2, 2);
    
    score += basePoints + lengthBonus;
  });
  
  return score;
}

// Check if game is over (blocks reach the top)
export function checkGameOver(grid, numCols) {
  // Game is over if top row has any non-empty blocks that aren't falling
  for (let j = 0; j < numCols; j++) {
    if (grid[0][j].color !== -1 && !grid[0][j].falling) {
      return true;
    }
  }
  
  return false;
}