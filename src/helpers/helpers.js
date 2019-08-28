export function rand(n) {
  return Math.floor(Math.random() * n);
}

export function fisherYates(array) {
  var m = array.length,
    t,
    i;

  // While there remain elements to shuffle
  while (m) {
    // Pick a remaining element
    i = Math.floor(Math.random() * m--);

    // And swap it with the current element
    t = array[m];
    array[m] = array[i];
    array[i] = t;
  }

  return array;
}

export function createLevel(l) {
  let lvlobj,
    level = Math.ceil((l + 1) / 8),
    rows = level + 7,
    colorSet = l % 8,
    colors = colorSet <= 4 ? 4 : colorSet,
    max = 10 + colors + level;

  lvlobj = {
    colorscheme: level,
    numberofrows: rows,
    maxclick: max,
    numberofcolors: colors
  };

  return lvlobj;
}

function findColor(i, j, colors) {
  const square = i + j;
  const color = rand(colors);

  if (square === 0) {
    return 2;
  }
  if (square === 1) {
    return color === 2 ? 3 : color;
  }

  return color;
}

export function populateGrid(rows, colors) {
  let grid = [];

  // create the grid array
  for (let i = 0; i < rows; i++) {
    // make a new array for each row of the grid
    grid[i] = [];
    for (let j = 0; j < rows; j++) {
      // get a random number between 0 and the # of available colors
      let color = findColor(i, j, colors);
      let active = i + j === 0 ? true : false;

      // assigned that number to a slot in the grid
      grid[i][j] = {
        color,
        active,
        showHint: false
      };
    }
  }

  return grid;
}

// update grid with new colors and active dots
export function setActive(
  job,
  topcorner,
  clickedColor,
  _props,
  numrows,
  checkWin
) {
  let newjob = [],
    grid = _props.game.grid.slice(0),
    loops = job.length;

  // loop through the jobs
  for (var x = 0; x < loops; x++) {
    // get the coordinates of the next dot
    let rowCol = job.shift().split(' ');
    let row = parseInt(rowCol[0], 10);
    let col = parseInt(rowCol[1], 10);

    // if this dot is either the old or new color continue
    if (
      grid[row][col].color === clickedColor ||
      grid[row][col].color === topcorner
    ) {
      // they should all be the new color
      grid[row][col] = {
        color: clickedColor,
        active: true,
        showHint: true
      };

      // get the coords of the surrounding dots
      let bottom = row < numrows - 1 ? grid[row + 1][col] : null;
      let right = col < numrows - 1 ? grid[row][col + 1] : null;
      let top = row > 0 ? grid[row - 1][col] : null;
      let left = col > 0 ? grid[row][col - 1] : null;

      // check each surrounding dot to see if it needs to be updated
      if (row < numrows - 1) {
        if (
          (bottom.color === topcorner && bottom.active === true) ||
          (bottom.color === clickedColor && bottom.active === false)
        ) {
          if (newjob.indexOf(row + 1 + ' ' + col) === -1) {
            newjob.push(row + 1 + ' ' + col);
          }
        }
      }

      if (col < numrows - 1) {
        if (
          (right.color === topcorner && right.active === true) ||
          (right.color === clickedColor && right.active === false)
        ) {
          if (newjob.indexOf(row + ' ' + (col + 1)) === -1) {
            newjob.push(row + ' ' + (col + 1));
          }
        }
      }

      if (row > 0) {
        if (
          (top.color === topcorner && top.active === true) ||
          (top.color === clickedColor && top.active === false)
        ) {
          if (newjob.indexOf(row - 1 + ' ' + col) === -1) {
            newjob.push(row - 1 + ' ' + col);
          }
        }
      }

      if (col > 0) {
        if (
          (left.color === topcorner && left.active === true) ||
          (left.color === clickedColor && left.active === false)
        ) {
          if (newjob.indexOf(row + ' ' + (col - 1)) === -1) {
            newjob.push(row + ' ' + (col - 1));
          }
        }
      }
    }
  }

  // update grid state
  _props.createGrid(grid);

  // if there are dots that need to be updated run again
  if (newjob.length > 0 && newjob !== []) {
    setTimeout(function() {
      setActive(newjob, topcorner, clickedColor, _props, numrows, checkWin);
    }, 45);
    // if there aren't then check for a win
  } else {
    checkWin(_props);
  }
}
