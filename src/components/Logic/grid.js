function rand(n) {
    return Math.floor(Math.random() * n);
}

export function populateGrid(rows, colors) {
    let grid = [];

    // create the grid array
    for (let i = 0; i < rows; i++) {

        // make a new array for each row of the grid
        grid[i] = [];
        for (let j = 0; j < rows; j++) {

            // get a random number between 0 and the # of available colors
            let c = rand(colors);

            // assigned that number to a slot in the grid
            grid[i][j] = c;
        }
    }

    return grid;
}