export function rand(n) {
    return Math.floor(Math.random() * n);
}

export function fisherYates(array) {
    var m = array.length,
        t, i;

    // While there remain elements to shuffle…
    while (m) {

        // Pick a remaining element…
        i = Math.floor(Math.random() * m--);

        // And swap it with the current element.
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
        colorSet = (l % 8),
        colors = colorSet <= 4 ? 4 : colorSet,
        max = 10 + colors + level;

    lvlobj = {
        "colorscheme": level,
        "numberofrows": rows,
        "maxclick": max,
        "numberofcolors": colors
    }

    return lvlobj;
}

export function populateGrid(rows, colors, goalColor) {
    let grid = [];

    // create the grid array
    for (let i = 0; i < rows; i++) {

        // make a new array for each row of the grid
        grid[i] = [];
        for (let j = 0; j < rows; j++) {

            // get a random number between 0 and the # of available colors
            let c = i + j === 0 ? 2 : rand(colors);
            let active = i + j === 0 ? true : false;

            // assigned that number to a slot in the grid
            grid[i][j] = [c, active];
        }
    }

    return grid;
}

// update grid with new colors and active dots
export function setActive(job, topcorner, clickedColor, _props, numrows, checkWin) {
    let newjob = [],
        grid = _props.game.grid.slice(0),
        loops = job.length;

    // loop through the jobs
    for (var x = 0; x < loops; x++) {

        // get the coordinates of the next dot
        let rowCol = job.shift().split(" ");
        let row = parseInt(rowCol[0], 10);
        let col = parseInt(rowCol[1], 10);

        // if this dot is either the old or new color continue
        if (grid[row][col][0] === clickedColor || grid[row][col][0] === topcorner) {

            // they should all be the new color
            grid[row][col] = [clickedColor, true];

            // get the coords of the surrounding dots
            let bottom = row < (numrows - 1) ? grid[row + 1][col] : [];
            let right = col < (numrows - 1) ? grid[row][col + 1] : [];
            let top = row > 0 ? grid[row - 1][col] : [];
            let left = col > 0 ? grid[row][col - 1] : [];

            // check each surrounding dot to see if it needs to be updated
            if (row < (numrows - 1)) {
                if ((bottom[0] === topcorner && bottom[1] === true) ||
                    (bottom[0] === clickedColor && bottom[1] === false)) {
                    if (newjob.indexOf((row + 1) + " " + col) === -1) {
                        newjob.push((row + 1) + " " + col);
                    }
                }
            }

            if (col < (numrows - 1)) {
                if ((right[0] === topcorner && right[1] === true) ||
                    (right[0] === clickedColor && right[1] === false)) {
                    if (newjob.indexOf(row + " " + (col + 1)) === -1) {
                        newjob.push(row + " " + (col + 1));
                    }
                }
            }

            if (row > 0) {
                if ((top[0] === topcorner && top[1] === true) ||
                    (top[0] === clickedColor && top[1] === false)) {
                    if (newjob.indexOf((row - 1) + " " + col) === -1) {
                        newjob.push((row - 1) + " " + col);
                    }
                }
            }

            if (col > 0) {
                if ((left[0] === topcorner && left[1] === true) ||
                    (left[0] === clickedColor && left[1] === false)) {
                    if (newjob.indexOf(row + " " + (col - 1)) === -1) {
                        newjob.push(row + " " + (col - 1));
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
