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

// Generate HSL color for a position - directly matching original logic
function generateHslColor(row, col, modifier) {
  let h, s, l;
  
  // Exactly following the logic of the hsl() function in the original script.js
  const x = (row + col) * 20; // Similar to how x is incremented in the original game

  if (modifier % 2 === 0) {
    h = Math.floor(360 - (row * col * 3)) % 360;
    s = 80;
    l = 50;
  } else {
    h = Math.floor(120 + (row + col) * 10) % 360;
    s = 90;
    l = 60;
  }
  
  // Apply modifier transformations - more closely matching the original logic
  switch (modifier) {
    case 2:
      h = (h + 90) % 360;
      break;
    case 3:
      s = 100;
      l = 50; // Match the original more closely
      break;
    case 4:
      l = Math.max(40, Math.min(75, l + (row - col) * 3));
      break;
    case 5:
      h = (h + 180) % 360;
      break;
    case 6:
      h = (h + 30 + row * 5) % 360;
      break;
    case 7:
      h = (h + 270 + col * 5) % 360;
      break;
  }
  
  return { h, s, l };
}

// Convert HSL to RGB string for React Native
export function hslToRgb(h, s, l) {
  // Normalize values
  h = h / 360;
  s = s / 100;
  l = l / 100;
  
  let r, g, b;
  
  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  
  return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
}

// Generate the initial solved grid
export function generateSolvedHueMoveGrid(size, modifier) {
  const grid = [];
  
  // Create the solved grid with pieces in their correct positions
  for (let row = 0; row < size; row++) {
    grid[row] = [];
    for (let col = 0; col < size; col++) {
      const { h, s, l } = generateHslColor(row, col, modifier);
      const color = hslToRgb(h, s, l);
      
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