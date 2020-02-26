import Immutable from 'immutable';
export default function reducer(state = 0, action) {
    switch (action.type) {
        case 'LOCAL_UPDATE_SESSION':
            console.log("LOCAL_UPDATE_SESSION", action);
            state = state.merge(action.update);
            console.log("LOCAL_UPDATE_SESSION2", state.toJS());
            return state;
        case 'RECEIVE_SESSION':
            console.log("RECEIVE SESSION", action);
            return Immutable.fromJS(action.session);
    }
    return state;
}
