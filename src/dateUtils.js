import moment from 'moment';
import time from 'time';
import tz from 'timezone/loaded';

/**
 * used to convert a date into a normalized strftime format with timezone
 * @type {String}
 */
const strftime_format = '%F %T %z';
/**
 * moment.js LDML format for parsing date strings
 * @type {String}
 */
const moment_format = 'YYYY-MM-DD HH:mm:ss zz';

/**
 * Convert a Javascript Date into node-time wrapper with the appropriate timezone.
 * @param {Date} date Javascript Date object
 * @param {String} timezone  Olson timezone for this date (e.g. 'America/New_York')
 * @return {node-time} object with the appropriate timezone
 */
export const toLocal = (date, timezone) => {
  const tz_date = new time.Date(date);
  tz_date.setTimezone(timezone); // localize the date into the specified timezone
  return tz(tz_date, strftime_format, timezone); // localized format w timezone offset
};

/**
 * Convert a Javascript Date into a Moment.js moment obj with the appropriate timezone.
 * Using the returned moment, you can call for example 'moment.calendar()' to get a
 * human readable relative time such as 'last Friday at 3:52 PM'.
 * @param {Date} date Javascript Date object
 * @param {String} timezone Olson timezone for this date (e.g. 'America/New_York')
 * @return {Object} MomentJS object with the appropriate timezone
 */
export const toMoment = (date, timezone) => {
  const local_datetime = toLocal(date, timezone);
  return moment(local_datetime, moment_format);
};

/**
 * Get market current datetime.
 * @return {Object} Moment.js object with market timezone
 */
export const getApiTimeZone = () => {
  return toMoment(new Date(), 'America/New_York');
};

// /**
// * Nasdaq & NYSE open at 09:30 and close at 16:00 EDT from Monday to Friday.
// * @return {Object} a Moment.js duration object indicating time left to open trade market
// */
// export const getTimeToOpen = () => {
//   const apiTimezone = getApiTimeZone();
//   const day = apiTimezone.day();
//   const hour = apiTimezone.hour();
//   let refDate = toMoment(new Date(), 'America/New_York');
//   refDate.set({'hour': 9, 'minute': 30, 'second': 0, 'millisecond': 0});
//   if (day === 6) {
//     refDate.add(2, 'days');
//   } else if (day === 5 && hour > 15) {
//     refDate.add(3, 'days');
//   } else if (day === 0 || hour > 15) {
//     refDate.add(1, 'days');
//   }
//   return Math.abs(refDate.diff(apiTimezone));
// };

/**
* Indicates if market is open and returns market current datetime as well.
* @return {Object<boolean, number>}
* @property {boolean} isOpen true when market is open
* @property {number} time unix timestamp corresponding to market datetime
*/
export const getMarketStatus = () => {
  const apiTime = getApiTimeZone();
  const openingDay = apiTime.day();
  let isOpen = openingDay > 0 && openingDay < 6;
  if (isOpen) {
    const openingHour = apiTime.hour();
    isOpen = openingHour * 60 < 959;
    if (isOpen) {
      const minutes = apiTime.minutes();
      isOpen = openingHour * 60 + minutes > 569;
    }
  }
  return { isOpen: isOpen, time: apiTime.unix() };
};
