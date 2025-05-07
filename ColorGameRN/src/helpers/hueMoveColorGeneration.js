/**
 * Custom level definitions for Hue Move mode
 * Each level is a grid of hex color values
 */

const customLevels = {

  level18: [
    ['#00ffff', '#00dfff', '#00bfff', '#009fff', '#007fff', '#005fff', '#003fff', '#001fff'],
    ['#1fffdf', '#1fdfdf', '#1fbfdf', '#1f9fdf', '#1f7fdf', '#1f5fdf', '#1f3fdf', '#1f1fdf'],
    ['#3fffbf', '#3fdfbf', '#3fbfbf', '#3f9fbf', '#3f7fbf', '#3f5fbf', '#3f3fbf', '#3f1fbf'],
    ['#5fff9f', '#5fdf9f', '#5fbf9f', '#5f9f9f', '#5f7f9f', '#5f5f9f', '#5f3f9f', '#5f1f9f'],
    ['#7fff7f', '#7fdf7f', '#7fbf7f', '#7f9f7f', '#7f7f7f', '#7f5f7f', '#7f3f7f', '#7f1f7f'],
    ['#9fff5f', '#9fdf5f', '#9fbf5f', '#9f9f5f', '#9f7f5f', '#9f5f5f', '#9f3f5f', '#9f1f5f'],
    ['#bfff3f', '#bfdf3f', '#bfbf3f', '#bf9f3f', '#bf7f3f', '#bf5f3f', '#bf3f3f', '#bf1f3f'],
    ['#dfff1f', '#dfdf1f', '#dfbf1f', '#df9f1f', '#df7f1f', '#df5f1f', '#df3f1f', '#df1f1f']
  ],

  level28: [
    ['#bfff00', '#c0ff1f', '#c1ff3f', '#c2ff5f', '#c3ff7f', '#c4ff9f', '#c5ffbf', '#c6ffdf'],
    ['#c8df00', '#c9df1f', '#cadf3f', '#cbdf5f', '#ccdf7f', '#cddf9f', '#cedfbf', '#cfdfdf'],
    ['#d1bf00', '#d2bf1f', '#d3bf3f', '#d4bf5f', '#d5bf7f', '#d6bf9f', '#d7bfbf', '#d8bfdf'],
    ['#da9f00', '#db9f1f', '#dc9f3f', '#dd9f5f', '#de9f7f', '#df9f9f', '#e09fbf', '#e19fdf'],
    ['#e37f00', '#e47f1f', '#e57f3f', '#e67f5f', '#e77f7f', '#e87f9f', '#e97fbf', '#ea7fdf'],
    ['#ec5f00', '#ed5f1f', '#ee5f3f', '#ef5f5f', '#f05f7f', '#f15f9f', '#f25fbf', '#f35fdf'],
    ['#f53f00', '#f63f1f', '#f73f3f', '#f83f5f', '#f93f7f', '#fa3f9f', '#fb3fbf', '#fc3fdf'],
    ['#fe1f00', '#ff1f1f', '#ff1f3f', '#ff1f5f', '#ff1f7f', '#ff1f9f', '#ff1fbf', '#ff1fdf']
  ],

  level38: [
    ['#9dff00', '#9eff1f', '#9fff3f', '#a0ff5f', '#a1ff7f', '#a2ff9f', '#a3ffbf', '#a4ffdf'],
    ['#a6df00', '#a7df1f', '#a8df3f', '#a9df5f', '#aadf7f', '#abdf9f', '#acdfbf', '#addfdf'],
    ['#afbf00', '#b0bf1f', '#b1bf3f', '#b2bf5f', '#b3bf7f', '#b4bf9f', '#b5bfbf', '#b6bfdf'],
    ['#b89f00', '#b99f1f', '#ba9f3f', '#bb9f5f', '#bc9f7f', '#bd9f9f', '#be9fbf', '#bf9fdf'],
    ['#c17f00', '#c27f1f', '#c37f3f', '#c47f5f', '#c57f7f', '#c67f9f', '#c77fbf', '#c87fdf'],
    ['#ca5f00', '#cb5f1f', '#cc5f3f', '#cd5f5f', '#ce5f7f', '#cf5f9f', '#d05fbf', '#d15fdf'],
    ['#d33f00', '#d43f1f', '#d53f3f', '#d63f5f', '#d73f7f', '#d83f9f', '#d93fbf', '#da3fdf'],
    ['#dc1f00', '#dd1f1f', '#de1f3f', '#df1f5f', '#e01f7f', '#e11f9f', '#e21fbf', '#e31fdf']
  ],

  level15: [
    ['#ffff00', '#ffcc00', '#ff9900', '#ff6600', '#ff3300'],
    ['#ccff33', '#cccc33', '#cc9933', '#cc6633', '#cc3333'],
    ['#99ff66', '#99cc66', '#999966', '#996666', '#993366'],
    ['#66ff99', '#66cc99', '#669999', '#666699', '#663399'],
    ['#33ffcc', '#33cccc', '#3399cc', '#3366cc', '#3333cc']
  ],

  level17: [
    ['#ffff00', '#ffda00', '#ffb600', '#ff9100', '#ff6d00', '#ff4800', '#ff2400'],
    ['#daff24', '#dada24', '#dab624', '#da9124', '#da6d24', '#da4824', '#da2424'],
    ['#b6ff48', '#b6da48', '#b6b648', '#b69148', '#b66d48', '#b64848', '#b62448'],
    ['#91ff6d', '#91da6d', '#91b66d', '#91916d', '#916d6d', '#91486d', '#91246d'],
    ['#6dff91', '#6dda91', '#6db691', '#6d9191', '#6d6d91', '#6d4891', '#6d2491'],
    ['#48ffb6', '#48dab6', '#48b6b6', '#4891b6', '#486db6', '#4848b6', '#4824b6'],
    ['#24ffda', '#24dada', '#24b6da', '#2491da', '#246dda', '#2448da', '#2424da']
  ],

  level27: [
    ['#ffff00', '#daff00', '#b6ff00', '#91ff00', '#6dff00', '#48ff00', '#24ff00'],
    ['#ffda24', '#dada24', '#b6da24', '#91da24', '#6dda24', '#48da24', '#24da24'],
    ['#ffb648', '#dab648', '#b6b648', '#91b648', '#6db648', '#48b648', '#24b648'],
    ['#ff916d', '#da916d', '#b6916d', '#91916d', '#6d916d', '#48916d', '#24916d'],
    ['#ff6d91', '#da6d91', '#b66d91', '#916d91', '#6d6d91', '#486d91', '#246d91'],
    ['#ff48b6', '#da48b6', '#b648b6', '#9148b6', '#6d48b6', '#4848b6', '#2448b6'],
    ['#ff24da', '#da24da', '#b624da', '#9124da', '#6d24da', '#4824da', '#2424da']
  ],

  level37: [
    ['#ff0700', '#ff0824', '#ff0948', '#ff0a6d', '#ff0b91', '#ff0cb6', '#ff0dda'],
    ['#da0f00', '#da1024', '#da1148', '#da126d', '#da1391', '#da14b6', '#da15da'],
    ['#b61700', '#b61824', '#b61948', '#b61a6d', '#b61b91', '#b61cb6', '#b61dda'],
    ['#911f00', '#912024', '#912148', '#91226d', '#912391', '#9124b6', '#9125da'],
    ['#6d2700', '#6d2824', '#6d2948', '#6d2a6d', '#6d2b91', '#6d2cb6', '#6d2dda'],
    ['#482f00', '#483024', '#483148', '#48326d', '#483391', '#4834b6', '#4835da'],
    ['#243700', '#243824', '#243948', '#243a6d', '#243b91', '#243cb6', '#243dda']
  ],

  level16: [
    ['#ffff00', '#ffd400', '#ffaa00', '#ff7f00', '#ff5500', '#ff2a00'],
    ['#d4ff2a', '#d4d42a', '#d4aa2a', '#d47f2a', '#d4552a', '#d42a2a'],
    ['#aaff55', '#aad455', '#aaaa55', '#aa7f55', '#aa5555', '#aa2a55'],
    ['#7fff7f', '#7fd47f', '#7faa7f', '#7f7f7f', '#7f557f', '#7f2a7f'],
    ['#55ffaa', '#55d4aa', '#55aaaa', '#557faa', '#5555aa', '#552aaa'],
    ['#2affd4', '#2ad4d4', '#2aaad4', '#2a7fd4', '#2a55d4', '#2a2ad4']
  ],

  level26: [
    ['#00ffff', '#00d4ff', '#00aaff', '#007fff', '#0055ff', '#002aff'],
    ['#2affd4', '#2ad4d4', '#2aaad4', '#2a7fd4', '#2a55d4', '#2a2ad4'], 
    ['#55ffaa', '#55d4aa', '#55aaaa', '#557faa', '#5555aa', '#552aaa'], 
    ['#7fff7f', '#7fd47f', '#7faa7f', '#7f7f7f', '#7f557f', '#7f2a7f'], 
    ['#aaff55', '#aad455', '#aaaa55', '#aa7f55', '#aa5555', '#aa2a55'],
    ['#d4ff2a', '#d4d42a', '#d4aa2a', '#d47f2a', '#d4552a', '#d42a2a']
  ],

  level36: [
    ['#45ff00', '#46ff2a', '#47ff55', '#48ff7f', '#49ffaa', '#4affd4'], 
    ['#4cd400', '#4dd42a', '#4ed455', '#4fd47f', '#50d4aa', '#51d4d4'],
    ['#53aa00', '#54aa2a', '#55aa55', '#56aa7f', '#57aaaa', '#58aad4'],
    ['#5a7f00', '#5b7f2a', '#5c7f55', '#5d7f7f', '#5e7faa', '#5f7fd4'],
    ['#615500', '#62552a', '#635555', '#64557f', '#6555aa', '#6655d4'],
    ['#682a00', '#692a2a', '#6a2a55', '#6b2a7f', '#6c2aaa', '#6d2ad4']
  ],

  level46: [
    ['#00ff0a', '#2aff0b', '#55ff0c', '#7fff0d', '#aaff0e', '#d4ff0f'],
    ['#00d411', '#2ad412', '#55d413', '#7fd414', '#aad415', '#d4d416'],
    ['#00aa18', '#2aaa19', '#55aa1a', '#7faa1b', '#aaaa1c', '#d4aa1d'],
    ['#007f1f', '#2a7f20', '#557f21', '#7f7f22', '#aa7f23', '#d47f24'],
    ['#005526', '#2a5527', '#555528', '#7f5529', '#aa552a', '#d4552b'],
    ['#002a2d', '#2a2a2e', '#552a2f', '#7f2a30', '#aa2a31', '#d42a32']
  ],

  level25: [
    ['#FD8A02', '#FD9A1C', '#FDA155', '#FFB0B0', '#FFC5E7'],
    ['#D4A602', '#DAAA37', '#DEAD68', '#E1BEBE', '#D6B9D6'],
    ['#AAAD00', '#B3B64B', '#BBBE8F', '#C4C3B6', '#AAB2D4'],
    ['#7FB401', '#8EBE43', '#8FC879', '#93CCAF', '#7FB9D4'],
    ['#33AC00', '#35BA51', '#36CB83', '#44D0B6', '#2AC7D4']
  ],
  
  level35: [
    ['#3BFFFF', '#00C9FF', '#007FFF', '#0055FF', '#0028B1'],
    ['#42FEC9', '#3DB6DD', '#557FAA', '#4D4DB6', '#501DB9'],
    ['#82F5A3', '#7BBBBA', '#7F7F7F', '#875287', '#7F2A7F'],
    ['#AAFB55', '#ACD161', '#AA8C55', '#B04948', '#AA2A55'],
    ['#D3FA2C', '#D7D730', '#D4AA2A', '#E1611B', '#DB1B1D']
  ],

  level45: [
    ['#FF7A00', '#DC6A2E', '#B44A3B', '#7F3C56', '#401F56'],
    ['#FFAC00', '#DC982E', '#AB715A', '#6A4B6F', '#3C4365'],
    ['#FFCF2C', '#DFC133', '#ADAB84', '#718886', '#3E6561'],
    ['#FFE685', '#EFE194', '#C9D09C', '#9ABC93', '#699876'],
    ['#FFF8B6', '#F6F1C0', '#E2EAC3', '#CBD5B9', '#A6C5A1']
  ],

  level55: [
    ['#F5F2ED', '#FCE3D0', '#FBCBBF', '#FFA58A', '#FF7600'],
    ['#EFF4E6', '#EAE2D2', '#E4C2C2', '#DE8282', '#EC296C'],
    ['#E2F3EA', '#C8D4D9', '#B9B6D3', '#AA7FB8', '#A637E0'],
    ['#CAEBED', '#A7D3E2', '#788BE2', '#7666DD', '#6928FF'],
    ['#97E5FF', '#73C6EE', '#49A0EC', '#406DF3', '#180AFF']
  ],
  
  level65: [
    ['#FF002B', '#FF4C88', '#FF66FB', '#EE99FF', '#F7CCFF'],
    ['#FF00AA', '#E347FF', '#D266FF', '#BB99FF', '#DDCCFF'],
    ['#D500FF', '#B349FF', '#9966FF', '#99AAFF', '#CCD5FF'],
    ['#9100FF', '#6E61FD', '#69ABFF', '#99DDFF', '#CCF4FF'],
    ['#5C00FF', '#1B9EFF', '#66CCFF', '#99F0FF', '#CCFFFE']
  ]
};

// Original RGB color generation function that works well
const generateRgbColor = (i, j, gridSize, _modifier, x, contrastMultiplier = 1.0, stage = 1) => {
  return generateRGBClassic(i, j, gridSize, _modifier, x, contrastMultiplier, stage);
}

const generateRGBClassic = (i, j, gridSize, _modifier, x, contrastMultiplier = 1.0, stage = 1) => {
  var stepi = 255 / (gridSize - 1);
  var stepj = 255 / (gridSize - 1);

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

// Additional RGB color generators for experimentation - accessible through hueMoveMode.js

// Smooth gradient with larger virtual grid size for finer transitions
const generateRGBSmooth = (i, j, gridSize, _modifier, x, contrastMultiplier = 1.0, stage = 1) => {
  // Use a larger virtual grid to create smoother transitions
  const virtualGridSize = gridSize * 3;
  // Scale the current position to the virtual grid
  const vi = (i / (gridSize - 1)) * (virtualGridSize - 1);
  const vj = (j / (gridSize - 1)) * (virtualGridSize - 1);
  
  return generateRGBClassic(vi, vj, virtualGridSize, _modifier, x, contrastMultiplier, stage);
};

// High contrast variant that amplifies color differences
const generateRGBHighContrast = (i, j, gridSize, _modifier, x, contrastMultiplier = 1.0, stage = 1) => {
  // Use higher contrast multiplier
  return generateRGBClassic(i, j, gridSize, _modifier, x, contrastMultiplier * 2.0, stage);
};

// Subtle variant with reduced contrast
const generateRGBSubtle = (i, j, gridSize, _modifier, x, contrastMultiplier = 1.0, stage = 1) => {
  // Use lower contrast multiplier
  return generateRGBClassic(i, j, gridSize, _modifier, x, contrastMultiplier * 0.6, stage);
};

// Radial pattern based on distance from center
const generateRGBRadial = (i, j, gridSize, _modifier, x, contrastMultiplier = 1.0, stage = 1) => {
  // Calculate center of grid
  const center = (gridSize - 1) / 2;
  // Calculate distance from center (normalized to 0-1)
  const di = (i - center) / center;
  const dj = (j - center) / center;
  const distance = Math.sqrt(di*di + dj*dj) / Math.sqrt(2);
  
  // Map distance to new coordinates
  const newI = distance * (gridSize - 1);
  const newJ = (Math.atan2(dj, di) / (Math.PI * 2) + 0.5) * (gridSize - 1);
  
  return generateRGBClassic(newI, newJ, gridSize, _modifier, x, contrastMultiplier, stage);
};

// Spiral pattern
const generateRGBSpiral = (i, j, gridSize, _modifier, x, contrastMultiplier = 1.0, stage = 1) => {
  // Calculate center of grid
  const center = (gridSize - 1) / 2;
  // Calculate distance from center (normalized to 0-1)
  const di = (i - center) / center;
  const dj = (j - center) / center;
  const distance = Math.sqrt(di*di + dj*dj) / Math.sqrt(2);
  
  // Calculate angle in radians
  const angle = Math.atan2(dj, di);
  
  // Create spiral effect: combine angle and distance
  const spiralFactor = 2.0;
  const newI = ((angle / (Math.PI * 2)) + distance * spiralFactor) % 1.0 * (gridSize - 1);
  const newJ = distance * (gridSize - 1);
  
  return generateRGBClassic(newI, newJ, gridSize, _modifier, x, contrastMultiplier, stage);
};

// Wave pattern with offset
const generateRGBWave = (i, j, gridSize, _modifier, x, contrastMultiplier = 1.0, stage = 1) => {
  // Apply wave transformation
  const frequency = 2.0;
  const amplitude = 0.15 * gridSize;
  const waveOffset = Math.sin((j / (gridSize - 1)) * Math.PI * frequency) * amplitude;
  
  // Apply offset to coordinates
  const newI = Math.max(0, Math.min(gridSize - 1, i + waveOffset));
  
  return generateRGBClassic(newI, j, gridSize, _modifier, x, contrastMultiplier, stage);
};

// Diagonal waves
const generateRGBDiagonal = (i, j, gridSize, _modifier, x, contrastMultiplier = 1.0, stage = 1) => {
  // Create diagonal wave pattern
  const frequency = 3.0;
  const diagonalPos = (i + j) / 2;
  const wave = Math.sin(diagonalPos / gridSize * Math.PI * frequency);
  
  // Apply to both coordinates slightly differently
  const newI = Math.max(0, Math.min(gridSize - 1, i + wave * 0.8));
  const newJ = Math.max(0, Math.min(gridSize - 1, j - wave * 0.8));
  
  return generateRGBClassic(newI, newJ, gridSize, _modifier, x, contrastMultiplier, stage);
};

// Map to use different generator functions based on a generator ID
const rgbGenerators = {
  classic: generateRGBClassic,
  smooth: generateRGBSmooth,
  highContrast: generateRGBHighContrast,
  subtle: generateRGBSubtle,
  radial: generateRGBRadial,
  spiral: generateRGBSpiral,
  wave: generateRGBWave,
  diagonal: generateRGBDiagonal
};

// Helper function to get a random generator
const getRandomGenerator = () => {
  const generators = Object.keys(rgbGenerators);
  const randomIndex = Math.floor(Math.random() * generators.length);
  return generators[randomIndex];
};

export { 
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
};