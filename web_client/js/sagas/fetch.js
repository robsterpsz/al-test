import { isoFetch } from '../lib/isoFetch.js';
import { call, fork, put, race, select, takeEvery } from 'redux-saga/effects';
import { FETCH, setProp } from '../actions/app.js';
import { getMarketStatus } from '../helpers/market.js';

/**
 * Generator function to handle json data requested from third parties api
 */
function* fetchManager() {

  const getMarketTime = (state) => state.app.market.time;

  while (true) {

    const action = yield takeEvery(FETCH);

    switch (action.payload.code) {

      // attempt to get market time by third party
      case 'defineApiTime': {

        let apiTime = yield select(getMarketTime);

        if (!apiTime) {

          try {
            // get market timezone from google api
            const url = `https://maps.googleapis.com/maps/api/timezone/json?location=40.71417,-74.00639&timestamp=${Math.floor(new Date()/1000)}&sensor=false`;

            const { response, cancel } = yield race({
              response: call(isoFetch, url),
              cancel: setTimeout(() => { throw new Error('Server timeout'); }, 5000)
            });

            if (!cancel) {
              const timeZone = response;
              apiTime -= timeZone.dstOffset;
            }

          } catch (e) {

            console.error('ERROR:', e);
            apiTime = Math.floor(new Date() / 1000);

          }

        }

        const { isOpen, time } = yield getMarketStatus(apiTime);

        yield put(setProp('market', { isOpen: isOpen, time: time }));

        break;

      }

      case 'defineStockNames': {

        // TODO: retrieve stock names from third party api

        break;
      }

    }

  }


}

export default function* rootSaga() {
  yield fork(fetchManager);
}
