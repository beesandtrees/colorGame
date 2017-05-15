import * as types from "../actions/types";

const initialState = {
    level: 4,
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
        default:
            return state;
    }
}