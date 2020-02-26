import { combineReducers } from "redux";

import session from './session';

import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
const createStoreWithMiddleware = applyMiddleware(
    thunk
)(createStore);
export default function configureStore(initialState) {
    const store = createStoreWithMiddleware(combineReducers({
        session,

    }), initialState);
    return store;
};