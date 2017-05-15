import { combineReducers } from 'redux';

// Reducers
import gameReducer from './game-reducers';

// Combine Reducers
var reducers = combineReducers({
    gameReducer: gameReducer
});

export default reducers;