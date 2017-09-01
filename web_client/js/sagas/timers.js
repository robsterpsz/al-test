import { delay } from 'redux-saga';
import { fork, put, take } from 'redux-saga/effects';
import { CLOSE, setProp } from '../actions/app.js';
import { getMarketStatus } from '../helpers/market.js';

function* marketTimer() {

  while(true) {

    const action = yield take(CLOSE);

    let { isOpen, nextOpeningTime, time } = yield getMarketStatus(action.market.time);

    // add 1 second until reaching nextOpeningTime
    while(!isOpen) {
      time += yield delay(1000, 1);
      isOpen = time > nextOpeningTime;
      yield put(setProp('market', { isOpen: isOpen, time: time}));
    }

  }

}

export default function* rootSaga() {
  yield fork(marketTimer);
}
