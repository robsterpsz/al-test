export const ADD_STOCK = 'app/stocks/ADD_STOCK';
export const CLOSE = 'app/stocks/CLOSE';
export const FEED_CACHE = 'app/stocks/FEED_CACHE';
export const FEED_END = 'app/stocks/FEED_END';
export const FEED_START = 'app/stocks/FEED_START';
export const FETCH = 'app/stocks/FETCH';
export const INIT_STOCK = 'app/stocks/INIT_STOCK';
export const SET_PROP = 'app/stocks/SET_PROP';
export const SOCK_ERROR = 'app/stocks/SOCK_ERROR';

export const addStock = (data) => {
  return {
    type: ADD_STOCK,
    lastUpdate: data.lastUpdate,
    stocks: data.stocks
  };
};

export const close = (market) => {
  return {
    type: CLOSE,
    market
  };
};

export const feedCache = (data, cacheSync) => {
  return {
    type: FEED_CACHE,
    data,
    cacheSync
  };
};

export const feedEnd = (data, cacheSync) => {
  return {
    type: FEED_END,
    data,
    cacheSync
  };
};

export const feedStart = (stockId, cacheSync) => {
  return {
    type: FEED_START,
    cacheSync,
    stockId
  };
};

export const initStock = (data, market) => {
  return {
    type: INIT_STOCK,
    lastUpdate: data.lastUpdate,
    stockCache: data.stockCache,
    stocks: data.stocks,
    market
  };
};

export const setProp = (key, value) => {
  return {
    type: SET_PROP,
    key,
    value
  };
};

export const sockError = (data) => {
  return {
    type: SOCK_ERROR,
    data
  };
};
