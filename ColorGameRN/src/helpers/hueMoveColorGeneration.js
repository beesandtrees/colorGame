/**
 * Custom level definitions for Hue Move mode
 * Each level is a 5x5 grid of hex color values
 */

const customLevels = {
  level4: [
    ['#FF7A00', '#DC6A2E', '#B44A3B', '#7F3C56', '#401F56'],
    ['#FFAC00', '#DC982E', '#AB715A', '#6A4B6F', '#3C4365'],
    ['#FFCF2C', '#DFC133', '#ADAB84', '#718886', '#3E6561'],
    ['#FFE685', '#EFE194', '#C9D09C', '#9ABC93', '#699876'],
    ['#FFF8B6', '#F6F1C0', '#E2EAC3', '#CBD5B9', '#A6C5A1']
  ],
  
  level2: [
    ['#FD8A02', '#FD9A1C', '#FDA155', '#FFB0B0', '#FFC5E7'],
    ['#D4A602', '#DAAA37', '#DEAD68', '#E1BEBE', '#D6B9D6'],
    ['#AAAD00', '#B3B64B', '#BBBE8F', '#C4C3B6', '#AAB2D4'],
    ['#7FB401', '#8EBE43', '#8FC879', '#93CCAF', '#7FB9D4'],
    ['#33AC00', '#35BA51', '#36CB83', '#44D0B6', '#2AC7D4']
  ],
  
  level3: [
    ['#3BFFFF', '#00C9FF', '#007FFF', '#0055FF', '#0028B1'],
    ['#42FEC9', '#3DB6DD', '#557FAA', '#4D4DB6', '#501DB9'],
    ['#82F5A3', '#7BBBBA', '#7F7F7F', '#875287', '#7F2A7F'],
    ['#AAFB55', '#ACD161', '#AA8C55', '#B04948', '#AA2A55'],
    ['#D3FA2C', '#D7D730', '#D4AA2A', '#E1611B', '#DB1B1D']
  ],
  
  level6: [
    ['#FF002B', '#FF4C88', '#FF66FB', '#EE99FF', '#F7CCFF'],
    ['#FF00AA', '#E347FF', '#D266FF', '#BB99FF', '#DDCCFF'],
    ['#D500FF', '#B349FF', '#9966FF', '#99AAFF', '#CCD5FF'],
    ['#9100FF', '#6E61FD', '#69ABFF', '#99DDFF', '#CCF4FF'],
    ['#5C00FF', '#1B9EFF', '#66CCFF', '#99F0FF', '#CCFFFE']
  ],
  
  level1: [
    ['#DB007A', '#FF6464', '#FFA552', '#FFDD77', '#FFFD02'],
    ['#A9005E', '#CE5D7B', '#CCA67E', '#E5DF88', '#DDFF02'],
    ['#7E0C6F', '#91488E', '#9A9A9A', '#B8E39D', '#95FF67'],
    ['#480489', '#51499F', '#5482B1', '#6DCBA4', '#4EE778'],
    ['#0A185A', '#012A83', '#0062B5', '#00B599', '#00C673']
  ],
  
  level5: [
    ['#F5F2ED', '#FCE3D0', '#FBCBBF', '#FFA58A', '#FF7600'],
    ['#EFF4E6', '#EAE2D2', '#E4C2C2', '#DE8282', '#EC296C'],
    ['#E2F3EA', '#C8D4D9', '#B9B6D3', '#AA7FB8', '#A637E0'],
    ['#CAEBED', '#A7D3E2', '#788BE2', '#7666DD', '#6928FF'],
    ['#97E5FF', '#73C6EE', '#49A0EC', '#406DF3', '#180AFF']
  ]
};

// Gradient 1: Hue changes per row, lightness increases, saturation decreases per column
function gradientType6(i, j, gridSize, baseHue) {
  const hue = (baseHue + i * 18) % 360;
  const saturation = 100 - j * (60 / (gridSize - 1));
  const lightness = 52 + j * (16 / (gridSize - 1));
  return `hsl(${Math.round(hue)}, ${Math.round(saturation)}%, ${Math.round(lightness)}%)`;
}

// Gradient 2: Hue changes drastically per row, saturation constant, lightness decreases per column
function gradientType5(i, j, gridSize, baseHue) {
  const hue = (baseHue + i * 36) % 360;
  const saturation = 88;
  const lightness = 70 - j * (30 / (gridSize - 1));
  return `hsl(${Math.round(hue)}, ${Math.round(saturation)}%, ${Math.round(lightness)}%)`;
}

// Gradient 3: Hue changes slightly, saturation drastically per row, lightness slightly per column
function gradientType3(i, j, gridSize, baseHue) {
  const hue = (baseHue + j * 5) % 360;
  const saturation = 100 - i * (80 / (gridSize - 1));
  const lightness = 60 + j * (10 / (gridSize - 1));
  return `hsl(${Math.round(hue)}, ${Math.round(saturation)}%, ${Math.round(lightness)}%)`;
}

// Gradient 4: Hue changes across both rows and columns, saturation and lightness also vary
function gradientType4(i, j, gridSize, baseHue) {
  // Hue changes with both i and j
  const hue = (baseHue + i * 24 + j * 24) % 360;
  // Saturation decreases across columns
  const saturation = 90 - j * (50 / (gridSize - 1));
  // Lightness increases across rows
  const lightness = 45 + i * (35 / (gridSize - 1));
  return `hsl(${Math.round(hue)}, ${Math.round(saturation)}%, ${Math.round(lightness)}%)`;
}

function gradientType1(i, j, gridSize, baseHue) {
  const ni = i / (gridSize - 1);
  const nj = j / (gridSize - 1);
  const diag = (ni + nj) / 2;
  const hue = (baseHue + diag * 180) % 360;
  const saturation = 100 - diag * 80; // 100% to 20%
  const lightness = 20 + diag * 60;   // 20% to 80%
  return `hsl(${Math.round(hue)}, ${Math.round(saturation)}%, ${Math.round(lightness)}%)`;
}

function gradientType2(i, j, gridSize, baseHue) {
  const ni = i / (gridSize - 1);
  const nj = j / (gridSize - 1);
  const diag = (ni + nj) / 2;
  const hue = (baseHue + 360 - diag * 180) % 360;
  const saturation = 20 + diag * 80; // 20% to 100%
  const lightness = 80 - diag * 60;  // 80% to 20%
  return `hsl(${Math.round(hue)}, ${Math.round(saturation)}%, ${Math.round(lightness)}%)`;
}

const generateHSLColor = (i, j, gridSize, _modifier, x, contrastMultiplier = 1.0, stage = 1) => {
  // Use _modifier to deterministically select gradient type and base hue
  const gradientTypes = [gradientType1, gradientType2, gradientType3, gradientType4, gradientType5, gradientType6];
  
  // Ensure _modifier is a valid number
  let mod = typeof _modifier === 'number' ? _modifier : 1;
  // If it's NaN or Infinite, use a default value
  if (isNaN(mod) || !isFinite(mod)) {
    console.warn(`Invalid _modifier value: ${_modifier}, using default value 1`);
    mod = 1;
  }
  
  // Ensure we get a valid index (0 to length-1)
  const typeIndex = Math.floor(Math.abs(mod)) % gradientTypes.length;
  
  console.log(`Using gradient type ${typeIndex} (modifier: ${mod})`);
  
  // Access the gradient function using the corrected index
  const chosenType = gradientTypes[typeIndex];
  
  // Double-check that we have a valid function
  if (typeof chosenType !== 'function') {
    console.error(`Invalid gradient type index: ${typeIndex} (modifier: ${mod})`);
    // Fallback to the first gradient type if there's an error
    return gradientTypes[0](i, j, gridSize, 0);
  }
  
  // Use _modifier and x to create a deterministic base hue
  // Ensure x is a valid number
  const validX = typeof x === 'number' && !isNaN(x) && isFinite(x) ? x : 0;
  const baseHue = Math.abs(Math.floor((mod + validX) * 137)) % 360;
  
  return chosenType(i, j, gridSize, baseHue);
};

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

export { customLevels, generateHSLColor, generateRgbColor };