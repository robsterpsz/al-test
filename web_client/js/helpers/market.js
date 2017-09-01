/**
 * This helper function returns an object showing the current market status
 * @param {number} marketTime - a unix timestamp
 * @returns {object} Returns object with following values:
 * @description isOpen {boolean} - market is open or not
 * @description nextOpeningTime {number} - unix timestamp with time left to next business day
 * @description time {number} - unix timestamp with market current datetime
 */
export const getMarketStatus = (time) => {

  let nextOpeningDate = new Date(time * 1000);
  nextOpeningDate.setHours(9, 30, 0, 0);

  const apiDate = new Date(time * 1000);
  const hour = apiDate.getHours();
  const day = apiDate.getDay();
  let daysAhead = 0;

  if (day === 6) {
    daysAhead = 2;
    nextOpeningDate.setDate(nextOpeningDate.getDate() + daysAhead);
  } else if (day === 5 && hour > 15) {
    daysAhead = 3;
    nextOpeningDate.setDate(nextOpeningDate.getDate() + daysAhead);
  } else if (day === 0 || hour > 15) {
    daysAhead = 1;
    nextOpeningDate.setDate(nextOpeningDate.getDate() + daysAhead);
  }

  const nextOpeningTime = Math.floor(nextOpeningDate / 1000);

  const isOpen = time > nextOpeningTime
    && time - nextOpeningTime < 6 * 60 * 60 + 30 * 60 + ( daysAhead * 24 * 60 * 60 );

  return { isOpen: isOpen, nextOpeningTime: nextOpeningTime, time: time };

};