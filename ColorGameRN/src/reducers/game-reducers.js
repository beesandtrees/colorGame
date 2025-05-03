import * as types from '../actions/types';

const initialState = {
  hasWon: null,
  level: 1,
  clicks: 0,
  grid: [],
  blocks: [],
  gameMode: 'classic', // 'classic' or 'puzzle'
  score: 0,
  matchesMade: 0
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
    case types.GAME_MODE:
      return {
        ...state,
        gameMode: action.mode
      };
    case types.SCORE:
      return {
        ...state,
        score: action.score
      };
    case types.MATCHES_MADE:
      console.log('Updating matches made in Redux:', action.matches);
      return {
        ...state,
        matchesMade: action.matches
      };
    default:
      return state;
  }
}