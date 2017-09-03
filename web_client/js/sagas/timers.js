import { CLOSE, setProp } from '../actions/app.js';
import { delay } from 'redux-saga';
import { call, fork, put, race, take } from 'redux-saga/effects';
import { getMarketStatus } from '../helpers/market.js';
import { isoFetch } from '../lib/isoFetch.js';

function* marketTimer() {

  while(true) {

    const action = yield take(CLOSE);

    let apiTime = Math.floor(new Date() / 1000);

    try {
      // get market timezone from google api
      const url = `https://maps.googleapis.com/maps/api/timezone/json?location=40.71417,-74.00639&timestamp=${apiTime}&sensor=false`;

      const { response, cancel } = yield race({
        response: call(isoFetch, url),
        cancel: setTimeout(() => { throw new Error('Server timeout'); }, 5000)
      });

      if (!cancel) {
        const timeZone = response;
        apiTime += timeZone.dstOffset + timeZone.rawOffset;
      }

    } catch (e) {

      console.error(e);
      apiTime = action.market.time;

    }

    let { isOpen, nextOpeningTime, time } = yield getMarketStatus(apiTime);

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
