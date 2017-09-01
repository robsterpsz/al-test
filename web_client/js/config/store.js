import createSagaMiddleware from 'redux-saga';
import localforage from 'localforage';
import logger from 'dev/logger';
import { autoRehydrate, persistStore, getStoredState } from 'redux-persist';
import { createStore, applyMiddleware, compose } from 'redux';

import rootReducer from 'reducers';
import stockSaga from 'sagas/stocks';
import timerSaga from 'sagas/timers';

const isProduction = process.env.NODE_ENV === 'production';

// Creating store
export default async() => {
  const sagaMiddleware = createSagaMiddleware();
  let middleware = null;

  if (isProduction) {
    middleware = applyMiddleware(sagaMiddleware);
  } else {
    // In development mode logger and DevTools are added
    middleware = applyMiddleware(logger, sagaMiddleware);

    // Enable DevTools if browser extension is installed
    if (!process.env.SERVER_RENDER && window.__REDUX_DEVTOOLS_EXTENSION__) { // eslint-disable-line
      middleware = compose(
        middleware,
        window.__REDUX_DEVTOOLS_EXTENSION__() // eslint-disable-line
      );
    }
  }

  // persist stuff
  localforage.config({ name: 'appStock' });
  const persistConfig = {
    storage: localforage
  };
  let restoredState = await getStoredState(persistConfig);
  const persisted = restoredState.app && restoredState.app.lastUpdate;

  // let store = createStore(rootReducer, restoredState, middleware);
  let store = createStore(
    rootReducer,
    restoredState,
    compose(
      middleware,
      //autoRehydrate()
    )
  );

  sagaMiddleware.run(stockSaga, persisted);
  sagaMiddleware.run(timerSaga);

  if (module.hot) {
    // Enable Webpack hot module replacement for reducers
    module.hot.accept('../reducers', () => {
      const nextRootReducer = require('../reducers/index').default; // eslint-disable-line global-require
      store.replaceReducer(nextRootReducer);
    });
  }

  // const persistor = createPersistor(store, persistConfig);
  //persistStore(store, persistConfig);

  return store;
};
