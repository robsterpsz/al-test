import io from 'socket.io-client';
import { delay, END, eventChannel } from 'redux-saga';
import { apply, call, fork, put, select, take } from 'redux-saga/effects';
import {
  // ADD_STOCK,
  addStock,
  close,
  FEED_CACHE,
  FEED_START,
  feedCache,
  feedStart,
  feedEnd,
  initStock,
  setProp,
  sockError,
  SOCK_ERROR,
} from '../actions/app.js';

const connect = () => {
  //const ip = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:8080';
  const socket = io();
  return new Promise(resolve => {
    socket.on('connect', () => {
      resolve(socket);
    });
  });
};

const subscribe = (socket) => {
  return eventChannel(emit => {

    socket.on('stock:init', (data, market) => {
      Object.keys(data.stockCache).map((key) => { data.stockCache[key] = []; });
      emit(initStock(data, market));
    });

    socket.on('stock:add', (data) => {
      emit(addStock(data));
    });

    socket.on('stock:close', (market) => {
      emit(close(market));
      emit(END);
    });

    socket.on('stock:error', (error) => {
      emit(sockError(error));
    });

    socket.on('stock:feedCache', (data, cacheSync) => {
      const stocks = Object.keys(data.stocks).map((key) => {
        return JSON.parse(data.stocks[key]);
      });
      emit(feedCache(stocks, cacheSync));
    });

    socket.on('stock:feedEnd', (data, cacheSync) => {
      emit(feedEnd(data, cacheSync));
    });

    const unsubscribe = () => {
      socket.disconnect();
    };

    return unsubscribe;
  });
};

function* activeError(error) {
  while (error.value > 0) {
    yield put(sockError({ message: error.message, value: error.value } ));
    error.value -= yield delay(1000, 1);
    error.message = error.message.replace(/\d+/, error.value);
  }
}


function* read(socket, persisted) {
  const channel = yield call(subscribe, socket);
  const getStockCacheById = (state, id) => state.app.stockCache[id];
  yield put(setProp('loading', true));
  if (!persisted) {
    yield apply(socket, socket.emit, ['stock:init']);
  } else {
    yield apply(socket, socket.emit, ['stock:add']);
  }
  while (true) {
    let action = yield take(channel);
    switch (action.type) {
      // case ADD_STOCK: {
      //   const prevStocks = yield select(getStockCache);
      //   const nextStocks = yield Object.assign({}, prevStocks);
      //   Object.keys(action.stocks).forEach((key) => {
      //     nextStocks[key].push(action.stocks[key][0]);
      //   });
      //   Object.assign(action.stocks, nextStocks);
      //   yield put(action);
      //   break;
      // }
      case SOCK_ERROR: {
        if (action.data.active) {
          action.data.active = false;
          yield fork(activeError, action.data);
        } else {
          yield put(action);
        }
        break;
      }
      case FEED_CACHE: {
        const prevStock = yield select(getStockCacheById, action.cacheSync.stockId);
        const nextStock = prevStock.concat(action.data);
        action.cacheSync.lastUpdate = parseInt(nextStock[nextStock.length - 1], 0);
        action.data = nextStock;
        yield put(action);
        // TODO: set a race to cancel if this gets too slow on huge cache datasets
        yield put(feedStart(action.cacheSync.stockId, action.cacheSync));
        break;
      }
      default: {
        yield put(action);
        break;
      }
    }
  }
}

function* write(socket) {
  while (true) {
    const payload = yield take(FEED_START);
    const cacheSync = yield payload.cacheSync;
    if (cacheSync) {
      yield apply(socket, socket.emit, ['stock:feedStart', cacheSync]);
    } else {
      yield apply(socket, socket.emit, ['stock:feedStart', { stockId: payload.stockId }]);
    }
  }
}

export default function* rootSaga(persisted) {
  const socket = yield call(connect);
  yield fork(read, socket, persisted);
  yield fork(write, socket);
}
