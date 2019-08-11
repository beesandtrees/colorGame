import * as types from '../actions/types';

const initialState = {
  hasWon: null,
  level: 20,
  clicks: 0,
  grid: [],
  blocks: []
};

export default function GameReducer(state = initialState, action = {}) {
  switch (action.type) {
    case types.CLICKS:
      return {
        ...state,
        clicks: action.click
      };
    case types.GRID:
      return {
        ...state,
        grid: action.grid
      };
    case types.BLOCKS:
      return {
        ...state,
        blocks: action.blocks
      };
    case types.HASWON:
      return {
        ...state,
        hasWon: action.won
      };
    case types.LEVEL:
      return {
        ...state,
        level: action.level
      };
    default:
      return state;
  }
}
