import io from 'socket.io-client';
import { END, eventChannel } from 'redux-saga';
import { apply, call, fork, put, take } from 'redux-saga/effects';
import {
  addStock,
  FEED_START,
  feedSuccess,
  initStock,
  setProp,
  socketError
} from '../actions/app.js';

function connect() {
  // TODO: figure out how to deploy automatically with auto socket
  const socket = io('http://localhost:8080');
  return new Promise(resolve => {
    socket.on('connect', () => {
      resolve(socket);
    });
  });
}

function subscribe(socket) {
  return eventChannel(emit => {

    const processIncomingStock = (data) => {
      const lastStocks = JSON.parse(data.lastStocks);
      const stocks = new Object();
      lastStocks.forEach((stock) => {
        const stockValues = Object.keys(stock).map((key) => {
          return stock[key];
        });
        stocks[stock.id] = [stockValues];
      });
      return {
        'lastStocks': lastStocks,
        'lastUpdate': parseInt(data.lastUpdate, 10),
        'stocks': stocks
      };
    };

    socket.on('stock:init', (data) => {
      const initData = processIncomingStock(data);
      emit(initStock(initData));
    });

    socket.on('stock:add', (data) => {
      const addData = processIncomingStock(data);
      emit(addStock(addData));
    });

    socket.on('stock:close', () => {
      emit(setProp('marketIsOpen', false));
      emit(END);
    });

    socket.on('stock:error', (error) => {
      emit(socketError(error));
    });

    socket.on('stock:feedSuccess', (data, stockId) => {
      const stocks = Object.keys(data.stocks).map((key) => {
        return JSON.parse(data.stocks[key]);
      });
      emit(feedSuccess(stocks, stockId));
    });

    const unsubscribe = () => {
      socket.disconnect();
    };

    return unsubscribe;
  });
}

function* read(socket) {
  const channel = yield call(subscribe, socket);
  yield apply(socket, socket.emit, ['stock:init']);
  while (true) {
    let action = yield take(channel);
    yield put(action);
  }
}

function* write(socket) {
  while (true) {
    const payload = yield take(FEED_START);
    yield apply(socket, socket.emit, ['stock:feedStart', payload.stockId]);
  }
}

export default function* rootSaga() {
  const socket = yield call(connect);
  yield fork(read, socket);
  yield fork(write, socket);
}