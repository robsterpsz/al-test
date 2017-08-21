import update from 'immutability-helper';

import {
  FEED_START,
  FEED_SUCCESS,
  INIT_STOCK,
  SET_PROP,
  SOCK_ERROR,
  ADD_STOCK
} from 'actions/app';

const initialState = {
  feedLoading: false,
  feedLoaded: [],
  lastStocks: null,
  lastUpdate: 0,
  marketIsOpen: true,
  selectedStock: '',
  socketError: null,
  stocks: []
};

const actionsMap = {
  [ADD_STOCK]: (state, action) => {
    const stocks = Object.assign({}, state.stocks);
    Object.keys(action.stocks).forEach((key) => { stocks[key].push(action.stocks[key][0]); });
    return update(state, {
      feedLoading: { $set: false },
      lastStocks: { $set : action.lastStocks },
      lastUpdate: { $set : action.lastUpdate },
      socketError: { $set: action.data },
      stocks: { $set: stocks }
    });
  },
  [FEED_START]: (state, action) => {
    return update(state, {
      feedLoading: { $set: true },
      selectedStock: { $set: action.stockId }
    });
  },
  [FEED_SUCCESS]: (state, action) => {
    return update(state, {
      feedLoading: { $set: false },
      feedLoaded: { $push: [action.stockId] },
      selectedStock: { $set: action.stockId },
      socketError: { $set: null },
      stocks: {
        [action.stockId]: { $set: action.data }
      }
    });
  },
  [INIT_STOCK]: (state, action) => {
    return update(state, {
      feedLoading: { $set: false },
      lastStocks: { $set : action.lastStocks },
      lastUpdate: { $set : action.lastUpdate },
      socketError: { $set: action.data },
      stocks: { $set: action.stocks }
    });
  },
  [SET_PROP]: (state, action) => {
    return update(state, {
      [action.key]: { $set: action.value }
    });
  },
  [SOCK_ERROR]: (state, action) => {
    return update(state, {
      socketError: { $set: action.data },
      feedLoading: { $set: false }
    });
  }
};

export default function reducer(state = initialState, action = {}) {
  const fn = actionsMap[action.type];
  return fn ? fn(state, action) : state;
}
