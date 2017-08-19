import io from 'socket.io-client';
import { eventChannel } from 'redux-saga';
import { apply, call, fork, put, take } from 'redux-saga/effects';
import { END } from 'redux-saga';
import {
  addStock,
  FEED_START,
  feedSuccess,
  initStock,
  setProp,
  socketError
} from '../actions/app.js';

function connect() {
  const socket = io('http://localhost:8080');
  return new Promise(resolve => {
    socket.on('connect', () => {
      resolve(socket);
    });
  });
}

function subscribe(socket) {
  return eventChannel(emit => {

    socket.on('stock:init', (data) => {
      const lastStocks = JSON.parse(data.lastStocks);
      const stocks = new Object();
      lastStocks.forEach((stock) => { stocks[stock.id] = [stock]; });
      const initData = {
        'lastStocks': lastStocks,
        'lastUpdate': parseInt(data.lastUpdate, 10),
        'stocks': stocks
      };
      emit(initStock(initData));
    });

    socket.on('stock:add', (data) => {
      const stocksData = {
        'lastStocks': JSON.parse(data.lastStocks),
        'lastUpdate': parseInt(data.lastUpdate, 10)
      };
      emit(addStock(stocksData));
    });

    socket.on('close', () => {
      emit(setProp('marketIsOpen', false));
      emit(END);
    });

    socket.on('socketError', (error) => {
      emit(socketError(error));
    });

    socket.on('feedSuccess', (data, stockId) => {
      const stocks = Object.keys(data).map((key) => {
        return JSON.parse(data[key]);
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
  yield apply(socket, socket.emit, ['initStock']);
  while (true) {
    let action = yield take(channel);
    yield put(action);
  }
}

function* write(socket) {
  while (true) {
    const payload = yield take(FEED_START);
    yield apply(socket, socket.emit, ['feedStart', payload.stockId]);
  }
}

export default function* rootSaga() {
  const socket = yield call(connect);
  yield fork(read, socket);
  yield fork(write, socket);
}