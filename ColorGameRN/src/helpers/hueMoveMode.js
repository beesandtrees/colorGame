// Helper functions for Hue Move game mode
// Based on the original game in hue-move/script.js

// Constants that match the original game
const PUZZLE_COLOR_MODIFIER_MAX = 7;

// Function to get a random integer between min and max (inclusive)
export function minMax(min, max) {
  return Math.floor(min + Math.random() * (max - min));
}

// Create a level configuration
export function createHueLevel(level) {
  // Base grid size - matching original game starting at 6x6
  const baseSize = 6;
  
  // Increase size every few levels, but cap at 10x10 for mobile playability
  const gridSize = Math.min(10, baseSize + Math.floor((level - 1) / 3));
  
  // Color modifier changes the gradient pattern - matching original logic
  const colorModifier = (level % PUZZLE_COLOR_MODIFIER_MAX) + 1;
  
  // More moves for higher levels
  const moveLimit = 25 + (level * 5);
  
  return {
    level: level,
    gridSize: gridSize,
    colorModifier: colorModifier,
    moveLimit: moveLimit
  };
}

function generateRgbColor(i, j, gridSize, _modifier, x) {
  var stepi = 255 / gridSize;
  var stepj = 255 / gridSize;
  var r =
    _modifier % 2 === 0
      ? Math.floor(255 - stepi * i)
      : Math.floor(0 + stepi * i);
  var g =
    _modifier % 2 === 0
      ? Math.floor(0 + stepj * j)
      : Math.floor(255 - stepj * j);
  var b = _modifier % 2 === 0 ? x + i : Math.floor(255 - stepi * i);
  var rgb;

  switch (_modifier) {
    case 2:
      rgb = "rgb(" + b + ", " + r + ", " + g + ")";
      break;
    case 3:
      rgb = "rgb(" + g + ", " + b + ", " + r + ")";
      break;
    case 4:
      rgb = "rgb(" + r + ", " + b + ", " + g + ")";
      break;
    case 5:
      rgb = "rgb(" + b + ", " + g + ", " + r + ")";
      break;
    case 6:
      rgb = "rgb(" + g + ", " + r + ", " + b + ")";
      break;
    default:
      rgb = "rgb(" + r + ", " + g + ", " + b + ")";
  }
  return rgb;
}


// Generate the initial solved grid
export function generateSolvedHueMoveGrid(size, modifier) {
  const grid = [];
  
  // Generate a random starting value for x (0-255) like the original
  const baseX = minMax(0, 255);
  console.log(`Using color modifier ${modifier} with baseX ${baseX}`);

  // Create the solved grid with pieces in their correct positions
  for (let row = 0; row < size; row++) {
    grid[row] = [];
    for (let col = 0; col < size; col++) {
      // Generate RGB color directly
      const color = generateRgbColor(row, col, size, modifier, baseX);
      
      // Check if this is a corner position
      const isCorner = 
        (row === 0 && col === 0) ||  // Top left
        (row === 0 && col === size - 1) ||  // Top right
        (row === size - 1 && col === 0) ||  // Bottom left
        (row === size - 1 && col === size - 1);  // Bottom right
        
      grid[row][col] = {
        color: color,
        originalRow: row,
        originalCol: col,
        isCorner: isCorner  // Explicitly mark corners
      };
    }
  }
  
  // Define corner positions and ensure they're correctly marked
  const corners = [
    { row: 0, col: 0 },                // Top Left
    { row: 0, col: size - 1 },         // Top Right
    { row: size - 1, col: 0 },         // Bottom Left
    { row: size - 1, col: size - 1 }   // Bottom Right
  ];
  
  // Force set the isCorner flag for these positions to ensure they're correct
  corners.forEach(corner => {
    if (grid[corner.row] && grid[corner.row][corner.col]) {
      grid[corner.row][corner.col].isCorner = true;
    }
  });
  
  console.log(`Locked corners: 
    TL=(0,0), 
    TR=(0,${size-1}), 
    BL=(${size-1},0), 
    BR=(${size-1},${size-1})
  `);
  
  return grid;
}

// Shuffle the grid like the original game
export function shuffleHueMoveGrid(grid) {
  if (!grid || !Array.isArray(grid) || grid.length === 0) {
    console.error('Invalid grid provided to shuffleHueMoveGrid');
    return [];
  }
  
  const size = grid.length;
  
  // First make a deep copy of the original grid
  const newGrid = JSON.parse(JSON.stringify(grid));
  
  // Keep track of the corners - these positions should be locked
  const corners = [
    { row: 0, col: 0 },                // Top Left
    { row: 0, col: size - 1 },         // Top Right
    { row: size - 1, col: 0 },         // Bottom Left
    { row: size - 1, col: size - 1 }   // Bottom Right
  ];
  
  // Create an array of all non-corner positions
  const movablePositions = [];
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const isCorner = corners.some(corner => corner.row === row && corner.col === col);
      if (!isCorner) {
        movablePositions.push({ row, col });
      }
    }
  }
  
  // Create a copy of all movable pieces
  const movablePieces = movablePositions.map(pos => ({
    ...newGrid[pos.row][pos.col],
    originalPosition: { row: pos.row, col: pos.col }
  }));
  
  // Shuffle the movable pieces
  for (let i = movablePieces.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [movablePieces[i], movablePieces[j]] = [movablePieces[j], movablePieces[i]];
  }
  
  // Create a new shuffled grid with the same size
  const shuffledGrid = Array(size).fill().map(() => Array(size).fill(null));
  
  // First, place the corner pieces in their fixed positions
  corners.forEach(corner => {
    shuffledGrid[corner.row][corner.col] = { 
      ...newGrid[corner.row][corner.col],
      isCorner: true  // Explicitly mark as a corner
    };
  });
  
  // Now place the shuffled movable pieces
  let movableIndex = 0;
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      // Skip corners since they're already placed
      const isCorner = corners.some(corner => corner.row === row && corner.col === col);
      if (isCorner) continue;
      
      // Place the next shuffled piece
      if (movableIndex < movablePieces.length) {
        shuffledGrid[row][col] = movablePieces[movableIndex++];
      }
    }
  }
  
  // Verify all positions are filled
  let filledPositions = 0;
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (shuffledGrid[row][col]) filledPositions++;
    }
  }
  
  console.log(`Shuffled grid has ${filledPositions} filled positions out of ${size*size} total`);
  
  // Double-check corners are properly set
  corners.forEach(corner => {
    if (!shuffledGrid[corner.row][corner.col]) {
      console.error(`Missing corner at [${corner.row},${corner.col}]`);
    } else {
      shuffledGrid[corner.row][corner.col].isCorner = true;
    }
  });
  
  return shuffledGrid;
}

// Check if the puzzle is solved
export function checkPuzzleSolved(grid) {
  if (!grid || !Array.isArray(grid) || grid.length === 0) {
    return false;
  }
  
  const size = grid.length;
  
  // Check if each piece is in its correct original position
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const piece = grid[row][col];
      if (!piece || piece.originalRow !== row || piece.originalCol !== col) {
        return false;
      }
    }
  }
  
  return true;
}

// Calculate score based on moves and level
export function calculateScore(movesTaken, moveLimit, level) {
  // Base score for completing the level
  const baseScore = 1000;
  
  // Bonus for remaining moves (same as the original game)
  const movesRemaining = Math.max(0, moveLimit - movesTaken);
  const moveBonus = movesRemaining * 50;
  
  // Level multiplier
  const levelMultiplier = 1 + (level * 0.1);
  
  return Math.floor((baseScore + moveBonus) * levelMultiplier);
}