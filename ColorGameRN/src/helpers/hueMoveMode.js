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
  let baseSize, gridSize, moveLimit, colorModifier, contrastMultiplier, stage;
  
  if (level <= 3) {
    gridSize = 5;
  } else if (level <= 7) {
    gridSize = 6;
  } else if (level <= 12) {
    gridSize = 7;
  } else if (level <= 18) {
    gridSize = 8;
  } else {
    gridSize = 9;
  }

  // Find the first level for the current grid size
  let firstLevelForGridSize;
  if (gridSize === 5) firstLevelForGridSize = 1;
  else if (gridSize === 6) firstLevelForGridSize = 4;
  else if (gridSize === 7) firstLevelForGridSize = 8;
  else if (gridSize === 8) firstLevelForGridSize = 13;
  else firstLevelForGridSize = 19;
  stage = ((level - firstLevelForGridSize) % 3) + 1;

  moveLimit = 25 + (level * 5) + ((gridSize - 5) * 5);

  if (level === 1) {
    colorModifier = 1;
    contrastMultiplier = 1.5;
  } else if (level === 2) {
    colorModifier = 4;
    contrastMultiplier = 1.4;
  } else if (level === 3) {
    colorModifier = 2;
    contrastMultiplier = 1.3;
  } else {
    colorModifier = (level % PUZZLE_COLOR_MODIFIER_MAX) + 1;
    contrastMultiplier = Math.max(1.0, 1.3 - (level * 0.05));
  }

  return {
    level: level,
    gridSize: gridSize,
    colorModifier: colorModifier,
    moveLimit: moveLimit,
    contrastMultiplier: contrastMultiplier,
    stage: stage
  };
}

function generateRgbColor(i, j, gridSize, _modifier, x, contrastMultiplier = 1.0, stage = 1) {
  var stepi = 255 / gridSize - 1;
  var stepj = 255 / gridSize - 1;

  // Progress from top-left to bottom-right
  var progress = (i + j) / (2 * (gridSize - 1));

  // Helper to blend base and contrast values
  function blend(base, contrast) {
    return Math.round(base * (1 - progress) + contrast * progress);
  }

  // Base values (no multiplier)
  var rBase = _modifier % 2 === 0 ? 255 - stepi * i : 0 + stepi * i;
  var gBase = _modifier % 2 === 0 ? 0 + stepj * j : 255 - stepj * j;
  var bBase = _modifier % 2 === 0 ? x + i : 255 - stepi * i;

  // Contrast values (with multiplier)
  var rContrast = _modifier % 2 === 0 ? 255 - (stepi * i * contrastMultiplier) : 0 + (stepi * i * contrastMultiplier);
  var gContrast = _modifier % 2 === 0 ? 0 + (stepj * j * contrastMultiplier) : 255 - (stepj * j * contrastMultiplier);
  var bContrast = _modifier % 2 === 0 ? x + i * contrastMultiplier : 255 - (stepi * i * contrastMultiplier);

  // Apply contrast multiplier to channels based on stage
  var r = rBase, g = gBase, b = bBase;
  if (stage === 1) {
    b = blend(bBase, bContrast);
  } else if (stage === 2) {
    g = blend(gBase, gContrast);
    b = blend(bBase, bContrast);
  } else if (stage >= 3) {
    r = blend(rBase, rContrast);
    g = blend(gBase, gContrast);
    b = blend(bBase, bContrast);
  }

  // Clamp values
  r = Math.min(255, Math.max(0, Math.round(r)));
  g = Math.min(255, Math.max(0, Math.round(g)));
  b = Math.min(255, Math.max(0, Math.round(b)));

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
export function generateSolvedHueMoveGrid(size, modifier, contrastMultiplier = 1.0, stage = 1) {
  const grid = [];
  const baseX = minMax(0, 255);
  for (let row = 0; row < size; row++) {
    grid[row] = [];
    for (let col = 0; col < size; col++) {
      const color = generateRgbColor(row, col, size, modifier, baseX, contrastMultiplier, stage);
      const isCorner =
        (row === 0 && col === 0) ||
        (row === 0 && col === size - 1) ||
        (row === size - 1 && col === 0) ||
        (row === size - 1 && col === size - 1);
      grid[row][col] = {
        color: color,
        originalRow: row,
        originalCol: col,
        isCorner: isCorner
      };
    }
  }
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