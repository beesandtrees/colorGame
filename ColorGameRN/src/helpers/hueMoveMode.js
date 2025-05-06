// Helper functions for Hue Move game mode
// Based on the original game in hue-move/script.js

// Import custom level definitions
import { customLevels, generateHSLColor, generateRgbColor } from './hueMoveColorGeneration';

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
// Generate a grid from predefined levels
export function generateCustomLevelGrid(levelKey) {
  if (!customLevels[levelKey]) {
    console.error(`Level ${levelKey} not found in customLevels`);
    return null;
  }

  const colorGrid = customLevels[levelKey];
  const size = colorGrid.length;
  const grid = [];

  for (let row = 0; row < size; row++) {
    grid[row] = [];
    for (let col = 0; col < size; col++) {
      const color = colorGrid[row][col];
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

// Generate the initial solved grid
export function generateSolvedHueMoveGrid(size, modifier, contrastMultiplier = 1.0, stage = 1) {
  // For levels with size 5, use predefined custom grids
  // if (size === 5) {
  //   if (modifier === 1) {
  //     return generateCustomLevelGrid('level1');
  //   } else if (modifier === 4) {
  //     return generateCustomLevelGrid('level2');
  //   } else if (modifier === 2) {
  //     return generateCustomLevelGrid('level3');
  //   } else if (modifier === 3) {
  //     return generateCustomLevelGrid('level4');
  //   } else if (modifier === 6) {
  //     return generateCustomLevelGrid('level5');
  //   } else if (modifier === 5) {
  //     return generateCustomLevelGrid('level6');
  //   }
  // }

  // For other levels or when custom level is not available, use procedural generation
  const grid = [];
  const baseX = minMax(0, 255);
  
  // Randomly choose between HSL and RGB color generation
  // Use a deterministic approach based on level parameters to ensure
  // the same level always gets the same color generation method
  const useHSL = ((size * 10 + modifier * 3 + stage) % 2) === 0;
  
  console.log(`Generating grid: size=${size}, modifier=${modifier}, baseX=${baseX}, colorMode=${useHSL ? 'HSL' : 'RGB'}`);
  
  try {
    for (let row = 0; row < size; row++) {
      grid[row] = [];
      for (let col = 0; col < size; col++) {
        // Make sure modifier is a valid number (1-6)
        const safeModifier = typeof modifier === 'number' 
                           ? Math.max(1, Math.min(6, Math.round(modifier))) 
                           : 1;
        
        let color;
        try {
          // Choose between HSL and RGB color generation
          if (useHSL) {
            color = generateHSLColor(row, col, size, safeModifier, baseX, contrastMultiplier, stage);
          } else {
            color = generateRgbColor(row, col, size, safeModifier, baseX, contrastMultiplier, stage);
          }
        } catch (error) {
          console.error(`Error generating color: ${error.message}`);
          // Fallback to a default color if there's an error
          color = `hsl(${(row * 60) % 360}, 80%, 50%)`;
        }
        
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
  } catch (error) {
    console.error(`Error generating grid: ${error.message}`);
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

  console.log(`Shuffled grid has ${filledPositions} filled positions out of ${size * size} total`);

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

// Calculate total levels in a round based on grid size
export function calculateTotalLevelsInRound(gridSize) {
  // Total levels in a round equals the number of cells in the grid
  return gridSize * gridSize;
}

// Helper function to generate a sample color grid with specified parameters
// Useful for testing different color generation methods
export function generateColorSample(size = 5, useHSL = true, colorModifier = 1, baseX = 128) {
  const grid = [];
  const stage = 1;
  const contrastMultiplier = 1.2;
  
  for (let row = 0; row < size; row++) {
    const rowColors = [];
    for (let col = 0; col < size; col++) {
      let color;
      if (useHSL) {
        color = generateHSLColor(row, col, size, colorModifier, baseX, contrastMultiplier, stage);
      } else {
        color = generateRgbColor(row, col, size, colorModifier, baseX, contrastMultiplier, stage);
      }
      rowColors.push(color);
    }
    grid.push(rowColors);
  }
  
  return grid;
}

// Check if current level is the last level in a round
export function isLastLevelInRound(level) {
  // Get the grid size for the current level
  const levelConfig = createHueLevel(level);
  const gridSize = levelConfig.gridSize;

  // Calculate total levels in this round
  const totalLevelsInRound = calculateTotalLevelsInRound(gridSize);

  // Find the first level for this grid size
  let firstLevelForGridSize;
  if (gridSize === 5) firstLevelForGridSize = 1;
  else if (gridSize === 6) firstLevelForGridSize = 4;
  else if (gridSize === 7) firstLevelForGridSize = 8;
  else if (gridSize === 8) firstLevelForGridSize = 13;
  else firstLevelForGridSize = 19;

  // Check if this is the last level in the round
  const lastLevelInRound = firstLevelForGridSize + totalLevelsInRound - 1;

  return level === lastLevelInRound;
}