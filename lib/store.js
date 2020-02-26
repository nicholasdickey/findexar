import Immutable from 'immutable';
import Root from 'window-or-global'
import configureStore from './reducers'
const initialState = {
    session: Immutable.fromJS({}),
    /*app: Immutable.fromJS({}),
    comments: Immutable.fromJS({}),
    session: Immutable.fromJS({}),
    context: Immutable.fromJS({}),
    queues: Immutable.fromJS({}),
    user: Immutable.fromJS({}),
    cache: Immutable.fromJS({ queues: {}, tags: {}, qwikets: {} }),*/

}

export const initStore = (preloadedState = initialState) => {
    const isServer = !process.browser ? true : false;
    //console.log("Store:", { isServer, browser: process.browser })


    if (!isServer) {
        Root.__CLIENT__ = true;
        Root.__SERVER__ = false;
        let session = Immutable.fromJS(preloadedState.session);
        //console.log("preloaded:", preloadedState)
        /* let app = Immutable.fromJS(preloadedState.app);
         let comments = Immutable.fromJS(preloadedState.comments);
         let session = Immutable.fromJS(preloadedState.session);
         let context = Immutable.fromJS(preloadedState.context);
         let queues = Immutable.fromJS(preloadedState.queues);
         let user = Immutable.fromJS(preloadedState.user);
         let cache = Immutable.fromJS(preloadedState.cache);*/
        preloadedState = {
            //  app,
            //  comments,
            session,
            //  context,
            // queues,
            // user,
            // cache
        }

    }


    return configureStore(preloadedState)
}