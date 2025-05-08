// Helper functions for Hue Move game mode
// Based on the original game in hue-move/script.js

// Import custom level definitions and color generators
import { 
  customLevels, 
  generateRgbColor, 
  generateRGBClassic,
  generateRGBSmooth,
  generateRGBHighContrast,
  generateRGBSubtle,
  generateRGBRadial,
  generateRGBSpiral,
  generateRGBWave,
  generateRGBDiagonal,
  rgbGenerators,
  getRandomGenerator
} from './hueMoveColorGeneration';

// Constants that match the original game
const PUZZLE_COLOR_MODIFIER_MAX = 7;

// Function to get a random integer between min and max (inclusive)
export function minMax(min, max) {
  return Math.floor(min + Math.random() * (max - min));
}

// Create a level configuration
export function createHueLevel(level) {
  let baseSize, gridSize, moveLimit, colorModifier, contrastMultiplier, stage, generatorType;

  if (level <= 7) {
    gridSize = 5;
  } else if (level <= 13) {
    gridSize = 6;
  } else if (level <= 19) {
    gridSize = 7;
  } else if (level <= 31) {
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

  // Assign specific color generation settings based on level
  if (level === 1) {
    colorModifier = 1;
    contrastMultiplier = 1.5;
    generatorType = 'classic';
  } else if (level === 2) {
    colorModifier = 4;
    contrastMultiplier = 1.4;
    generatorType = 'smooth';
  } else if (level === 3) {
    colorModifier = 2;
    contrastMultiplier = 1.3;
    generatorType = 'highContrast';
  } else {
    colorModifier = (level % PUZZLE_COLOR_MODIFIER_MAX) + 1;
    contrastMultiplier = Math.max(1.0, 1.3 - (level * 0.05));
    
    // Cycle through different generators as levels progress
    const generatorTypes = ['classic', 'smooth', 'highContrast', 'subtle', 'radial', 'spiral', 'wave', 'diagonal'];
    const generatorIndex = Math.floor((level - 1) % generatorTypes.length);
    generatorType = generatorTypes[generatorIndex];
  }

  return {
    level: level,
    gridSize: gridSize,
    colorModifier: colorModifier,
    moveLimit: moveLimit,
    contrastMultiplier: contrastMultiplier,
    stage: stage,
    generatorType: generatorType
  };
}
// Generate a grid from predefined levels
export function generateCustomLevelGrid(level, requestedSize) {
  const levelKey = `${level}`;

  console.log(`Generating custom level grid for ${levelKey}`);

  if (!customLevels[levelKey]) {
    console.error(`Level ${levelKey} not found in customLevels`);
    return null;
  }

  const colorGrid = customLevels[levelKey];
  const size = colorGrid.length;
  
  // Check if the custom grid size matches our requested size
  if (size !== requestedSize) {
    console.warn(`Custom level ${levelKey} has size ${size}, but we need size ${requestedSize}`);
    
    // If we need a 5x5 grid but have a larger grid, we can take the center section
    if (requestedSize === 5 && size > 5) {
      const startOffset = Math.floor((size - 5) / 2);
      const grid = [];
      
      for (let row = 0; row < 5; row++) {
        grid[row] = [];
        for (let col = 0; col < 5; col++) {
          const sourceRow = startOffset + row;
          const sourceCol = startOffset + col;
          const color = colorGrid[sourceRow][sourceCol];
          
          const isCorner =
            (row === 0 && col === 0) ||
            (row === 0 && col === 4) ||
            (row === 4 && col === 0) ||
            (row === 4 && col === 4);
            
          grid[row][col] = {
            color: color,
            originalRow: row,
            originalCol: col,
            isCorner: isCorner
          };
        }
      }
      return grid;
    } else {
      // If the sizes don't match and we can't extract a subgrid, return null
      return null;
    }
  }

  // Normal case - grid size matches what we need
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
export function generateSolvedHueMoveGrid(size, modifier, contrastMultiplier = 1.0, stage = 1, generatorType = 'classic', randomSeed = null) {
  // Check if we're trying to use a custom level
  // These have specific stage numbers corresponding to the customLevels object keys
  const customStages = [15, 16, 17, 18, 25, 26, 27, 28, 35, 36, 37, 38, 45, 46, 47, 48, 55, 65];
  
  if (customStages.includes(stage) && size === 5) {
    // Try to load a predefined level from customLevels
    const levelGrid = generateCustomLevelGrid(`level${stage}`, size);
    if (levelGrid) {
      console.log(`Using predefined level${stage} grid`);
      return levelGrid;
    } else {
      console.warn(`Custom level${stage} not found in customLevels!`);
    }
  }

  // For all other levels, use procedural generation with seed influence
  const grid = [];
  
  // If randomSeed is provided, use it to influence the base color value
  // This ensures different patterns even with the same parameters
  const baseX = randomSeed ? (randomSeed % 256) : minMax(0, 255);
  
  // Get the appropriate color generator
  const useGenerator = rgbGenerators[generatorType] || rgbGenerators.classic;
  
  console.log(`Generating grid: size=${size}, modifier=${modifier}, baseX=${baseX}, generatorType=${generatorType}, seed=${randomSeed || 'none'}`);
  
  try {
    for (let row = 0; row < size; row++) {
      grid[row] = [];
      for (let col = 0; col < size; col++) {
        // Make sure modifier is a valid number (1-6)
        const safeModifier = typeof modifier === 'number' 
                           ? Math.max(1, Math.min(6, Math.round(modifier))) 
                           : 1;
        
        // If randomSeed is provided, use it to create variations in the row/col values
        // This creates more varied patterns without changing the generator algorithm
        const effectiveRow = randomSeed ? (row + (randomSeed % 3) - 1) % size : row;
        const effectiveCol = randomSeed ? (col + ((randomSeed / 10) % 3) - 1) % size : col;
        
        let color;
        try {
          // Use the selected color generator function with seed-influenced values
          color = useGenerator(effectiveRow, effectiveCol, size, safeModifier, baseX, contrastMultiplier, stage);
        } catch (error) {
          console.error(`Error generating color: ${error.message}`);
          // Fallback to a default color if there's an error
          color = `rgb(${Math.round((row/size) * 255)}, ${Math.round((col/size) * 255)}, 128)`;
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
export function generateColorSample(size = 5, generatorType = 'classic', colorModifier = 1, baseX = 128) {
  const grid = [];
  const stage = 1;
  const contrastMultiplier = 1.2;
  
  // Get the appropriate color generator
  const useGenerator = rgbGenerators[generatorType] || rgbGenerators.classic;
  
  for (let row = 0; row < size; row++) {
    const rowColors = [];
    for (let col = 0; col < size; col++) {
      let color = useGenerator(row, col, size, colorModifier, baseX, contrastMultiplier, stage);
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