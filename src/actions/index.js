import * as types from './types';

export function updateClicks(click) {
  return {
    type: types.CLICKS,
    click
  };
}

export function createGrid(grid, blocks) {
  return {
    type: types.GRID,
    grid,
    blocks
  };
}