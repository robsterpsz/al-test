export const ADD_CONTROL = 'ADD_CONTROL';
export const FEED_ERROR = 'FEED_ERROR';
export const FEED_START = 'FEED_START';
export const FEED_SUCCESS = 'FEED_SUCCESS';
export const NEW_STOCK = 'NEW_STOCK';
export const SET_PROP = 'SET_PROP';
export const UPDATE_STOCK = 'UPDATE_STOCK';

export function addControl(data) {
  return {
    type: ADD_CONTROL,
    data
  };
}

export function feedError(data) {
  return {
    type: FEED_ERROR,
    data
  };
}

export function feedStart(socket, data) {
  socket.emit('feedStart', data);
  return {
    type: FEED_START,
    data
  };
}

export function feedSuccess(data) {
  return {
    type: FEED_SUCCESS,
    data
  };
}

export function newStock(data) {
  return (dispatch) => {
    JSON.parse(data.updateData).forEach((updateData) => {
      const key = updateData.t;
      dispatch(updateStock(updateData, key));
    });
    dispatch(addControl(data));
  };
}

export function setProp(key, value) {
  return {
    type: SET_PROP,
    key,
    value
  };
}

export function updateStock(updateData, key) {
  return {
    type: UPDATE_STOCK,
    updateData,
    key
  };
}
