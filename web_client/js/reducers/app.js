import update from 'immutability-helper';

import {
  ADD_STOCK,
  CLOSE,
  FEED_CACHE,
  FEED_END,
  FEED_START,
  INIT_STOCK,
  SET_PROP,
  SOCK_ERROR,
} from 'actions/app';

const initialState = {
  cacheSync: {},
  lastUpdate: 0,
  loading: false,
  market: {},
  selectedStockId: '',
  socketError: {},
  stockCache: {},
  stocks: {}
};

const actionsMap = {
  [ADD_STOCK]: (state, action) => {
    const stocks = Object.assign({}, state.stocks);
    Object.keys(action.stocks).forEach((key) => { stocks[key].push(action.stocks[key][0]); });
    return update(state, {
      loading: { $set: false },
      lastUpdate: { $set : action.lastUpdate },
      socketError: { $set: initialState.socketError },
      stocks: { $set: stocks }
    });
  },
  [CLOSE]: (state, action) => {
    return update(state, {
      market: { $set: action.market }
    });
  },
  [FEED_CACHE]: (state, action) => {
    return update(state, {
      loading: { $set: false },
      cacheSync: {
        [action.cacheSync.stockId]: { $set: action.cacheSync }
      },
      selectedStockId: { $set: action.cacheSync.stockId },
      socketError: { $set: initialState.socketError },
      stockCache: {
        [action.cacheSync.stockId]: { $set: action.data }
      }
    });
  },
  [FEED_END]: (state, action) => {
    return update(state, {
      loading: { $set: false },
      cacheSync: {
        [action.cacheSync.stockId]: { $set: action.cacheSync }
      },
      selectedStockId: { $set: action.cacheSync.stockId },
      socketError: { $set: initialState.socketError },
      stocks: {
        [action.cacheSync.stockId]: { $set: action.data }
      }
    });
  },
  [FEED_START]: (state, action) => {
    return update(state, {
      loading: { $set: true },
      selectedStockId: { $set: action.stockId }
    });
  },
  [INIT_STOCK]: (state, action) => {
    return update(state, {
      loading: { $set: false },
      lastUpdate: { $set : action.lastUpdate },
      market: { $set: action.market },
      socketError: { $set: initialState.socketError },
      stocks: { $set: action.stocks },
      stockCache: { $set: action.stockCache }
    });
  },
  [SET_PROP]: (state, action) => {
    return update(state, {
      [action.key]: { $set: action.value }
    });
  },
  [SOCK_ERROR]: (state, action) => {
    return update(state, {
      socketError: { $merge: action.data },
      loading: { $set: false }
    });
  }
};

export default function reducer(state = initialState, action = {}) {
  const fn = actionsMap[action.type];
  return fn ? fn(state, action) : state;
}
