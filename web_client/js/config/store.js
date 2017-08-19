import createSagaMiddleware from 'redux-saga';
import logger from 'dev/logger';
// import thunk from 'redux-thunk';
import { createStore, applyMiddleware, compose } from 'redux';

import rootReducer from 'reducers';
import stockSaga from 'sagas/stocks';

const isProduction = process.env.NODE_ENV === 'production';

// Creating store
export default () => {
  const sagaMiddleware = createSagaMiddleware();
  let store = null;
  let middleware = null;

  if (isProduction) {
    // In production adding only thunk middleware
    // middleware = applyMiddleware(sagaMiddleware, thunk);
    middleware = applyMiddleware(sagaMiddleware);
  } else {
    // In development mode beside thunk
    // logger and DevTools are added
    // middleware = applyMiddleware(sagaMiddleware, thunk, logger);
    middleware = applyMiddleware(logger, sagaMiddleware);

    // Enable DevTools if browser extension is installed
    if (!process.env.SERVER_RENDER && window.__REDUX_DEVTOOLS_EXTENSION__) { // eslint-disable-line
      middleware = compose(
        middleware,
        window.__REDUX_DEVTOOLS_EXTENSION__() // eslint-disable-line
      );
    }
  }

  store = createStore(
    rootReducer,
    middleware
  );

  sagaMiddleware.run(stockSaga);

  if (module.hot) {
    // Enable Webpack hot module replacement for reducers
    module.hot.accept('../reducers', () => {
      const nextRootReducer = require('../reducers/index').default; // eslint-disable-line global-require
      store.replaceReducer(nextRootReducer);
    });
  }

  return store;
};
