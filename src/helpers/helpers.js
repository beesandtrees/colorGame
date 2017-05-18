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

    // l = game.level
    // 0-4 === 1, 5-8 === 2, ...

    let level = Math.ceil((l+1)/4),
        rows = level + 7,
        colors = (l%4) + 4,
        max = (l+colors)*2,
        maxclick = max > 15 ? max : 15 + l;

    return {
        "numberofrows": rows,
        "maxclick": maxclick,
        "numberofcolors": colors
    }
}

export function populateGrid(rows, colors, goalColor) {
    let grid = [];
    let last = (rows-1)*2;

    // create the grid array
    for (let i = 0; i < rows; i++) {

        // make a new array for each row of the grid
        grid[i] = [];
        for (let j = 0; j < rows; j++) {

            // get a random number between 0 and the # of available colors
            let c = i+j === last ? goalColor : rand(colors);

            let active = i === 0 && j === 0 ? true : false;

            // assigned that number to a slot in the grid
            grid[i][j] = [c, active];
        }
    }

    return grid;
}
