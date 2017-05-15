import * as types from "../actions/types";

const initialState = {
    level: 1,
    clicks: 0,
    grid: [],
    blocks: []
};

export default function GameReducer(state = initialState, action = {}) {
    switch (action.type) {
        case types.CLICKS:
        	let updatedClicks = state.clicks + 1
            return {
                ...state,
                clicks: updatedClicks
            };
        case types.GRID:
            return {
                ...state,
                grid: action.grid,
                blocks: action.blocks
            };            
        default:
            return state;
    }
}