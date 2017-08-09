import { /*fromJS,*/ List, Map, /*toJS, update*/ } from 'immutable';

import {
  ADD_CONTROL,
  FEED_ERROR,
  FEED_START,
  FEED_SUCCESS,
  UPDATE_STOCK
} from 'actions/app';

const initialState = Map({
  feedError: null,
  feedLoading: false,
  AAPL: List([]),
  ABC: List([]),
  F: List([]),
  MSFT: List([]),
  TSLA: List([]),
  feedStock: Map({
    AAPL: [],
    ABC: [],
    F: [],
    MSFT: [],
    TSLA: []
  }),
  newStock: null,
  selectedStock: ''
});

const actionsMap = {
  [ADD_CONTROL]: (state, action) => {
    return state.merge(Map({
      newStock: action.data
    }));
  },
  [FEED_ERROR]: (state, action) => {
    return state.merge(Map({
      feedError: action.data,
      feedLoading: false
    }));
  },
  [FEED_START]: (state, action) => {
    return state.merge(Map({
      feedLoading: true,
      selectedStock: action.data
    }));
  },
  [FEED_SUCCESS]: (state, action) => {
    // const key = Object.keys(action.data).join('');
    // return state.setIn(['feedStock', key], Map(action.data[key]));
    return state.merge(Map(action.data))
      .merge(Map({
        feedError: null,
        feedLoading: false
      }));
  },
  [UPDATE_STOCK]: (state, action) => {
    // const myList = state.get(action.key);
    // myList.set(myList.size, action.updateData).toJS();
    return state.merge(Map({
      [action.key]: state.get(action.key).set(state.get(action.key).size, action.updateData)
    }));

  }
};

export default function reducer(state = initialState, action = {}) {
  const fn = actionsMap[action.type];
  return fn ? fn(state, action) : state;
}
