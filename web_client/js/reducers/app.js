import update from 'react-addons-update';

import {
  ADD_CONTROL,
  FEED_ERROR,
  FEED_START,
  FEED_SUCCESS,
  SET_PROP,
  UPDATE_STOCK
} from 'actions/app';


const initialState = {
  feedError: null,
  feedLoading: false,
  AAPL: [],
  ABC: [],
  F: [],
  MSFT: [],
  TSLA: [],
  newStock: null,
  selectedStock: ''
};

const actionsMap = {
  [ADD_CONTROL]: (state, action) => {
    return update(state, {
      newStock: { $set: action.data }
    });
  },
  [FEED_ERROR]: (state, action) => {
    return update(state, {
      feedError: { $set: action.data },
      feedLoading: { $set: false }
    });
  },
  [FEED_START]: (state, action) => {
    return update(state, {
      feedLoading: { $set: true },
      selectedStock: { $set: action.data }
    });
  },
  [FEED_SUCCESS]: (state, action) => {
    const key = Object.keys(action.data).join('');
    return update(state, {
      feedError: { $set: null },
      feedLoading: { $set: false },
      [key]: {$set: action.data[key]}
    });
  },
  [SET_PROP]: (state, action) => {
    return update(state, {
      [action.key]: { $set: action.value }
    });
  },
  [UPDATE_STOCK]: (state, action) => {
    return update(state, {
      [action.key]: { $push: [action.updateData] }
    });
  }

};

export default function reducer(state = initialState, action = {}) {
  const fn = actionsMap[action.type];
  return fn ? fn(state, action) : state;
}
