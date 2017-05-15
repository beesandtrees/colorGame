import * as types from './types';

export function updateClicks(click) {
  return {
    type: types.CLICKS,
    click
  };
}

export function createGrid(grid) {
  return {
    type: types.GRID,
    grid
  };
}

export function loadBlocks(blocks) {
  return {
    type: types.BLOCKS,
    blocks
  };
}

