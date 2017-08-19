export const ADD_STOCK = 'ADD_STOCK';
export const FEED_START = 'FEED_START';
export const FEED_SUCCESS = 'FEED_SUCCESS';
export const INIT_STOCK = 'INIT_STOCK';
export const SET_PROP = 'SET_PROP';
export const SOCK_ERROR = 'SOCK_ERROR';

export const addStock = (data) => {
  return {
    type: ADD_STOCK,
    lastStocks: data.lastStocks,
    lastUpdate: data.lastUpdate
  };
};

export const feedStart = (stockId) => {
  return {
    type: FEED_START,
    stockId
  };
};

export const feedSuccess = (data, stockId) => {
  return {
    type: FEED_SUCCESS,
    data,
    stockId
  };
};

export const initStock = (data) => {
  return {
    type: INIT_STOCK,
    lastStocks: data.lastStocks,
    lastUpdate: data.lastUpdate,
    stocks: data.stocks
  };
};

export const setProp = (key, value) => {
  return {
    type: SET_PROP,
    key,
    value
  };
};

export const socketError = (data) => {
  return {
    type: SOCK_ERROR,
    data
  };
};
