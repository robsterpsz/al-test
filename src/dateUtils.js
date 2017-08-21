import moment from 'moment';
import time from 'time';
import tz from 'timezone/loaded';

const strftime_format = '%F %T %z'; // used to convert a date into a normalized strftime format with timezone
const moment_format = 'YYYY-MM-DD HH:mm:ss zz'; // moment.js LDML format for parsing date strings

/**
 * Convert a Javascript Date into node-time wrapper with the appropriate timezone.
 * @param date     {Date}   Javascript Date object
 * @param timezone {String} Olson timezone for this date (e.g. 'America/New_York')
 * @return node-time object with the appropriate timezone
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
 * @param date     {Date}   Javascript Date object
 * @param timezone {String} Olson timezone for this date (e.g. 'America/New_York')
 * @return moment with the appropriate timezone
 */
export const toMoment = (date, timezone) => {
  const local_datetime = toLocal(date, timezone);
  return moment(local_datetime, moment_format);
};

/**
* Nasdaq opens at 09:30 and closes at 16:00 EDT from Monday to Friday
* NYSE opens at 09:30 and closes at 16:00 ET from Monday to Friday
* @return moment with the appropriate timezone
*/
export const getApiTimeZone = () => {
  return toMoment(new Date(), 'America/New_York');
};
/**
*  @return a Moment.js duration object indicating time left to open trade market
*/
export const getTimeToOpen = () => {
  const apiTimezone = getApiTimeZone();
  const day = apiTimezone.day();
  const hour = apiTimezone.hour();
  let refDate = toMoment(new Date(), 'America/New_York');
  refDate.set({'hour': 9, 'minute': 30, 'second': 0, 'millisecond': 0});
  if (day === 6) {
    refDate.add(2, 'days');
  } else if (day === 5 && hour > 15) {
    refDate.add(3, 'days');
  } else if (day === 0 || hour > 15) {
    refDate.add(1, 'days');
  }
  return Math.abs(refDate.diff(apiTimezone));
};

/**
* @return true when market is open*
*/
export const getMarketStatus = () => {
  const apiTimezone = getApiTimeZone();
  const openingDay = apiTimezone.day();
  let marketStatus = openingDay > 0 && openingDay < 6;
  if (marketStatus) {
    const openingHour = apiTimezone.hour();
    marketStatus = openingHour * 60 < 959;
    if (marketStatus) {
      const minutes = apiTimezone.minutes();
      marketStatus = openingHour * 60 + minutes > 569;
    }
  }
  return marketStatus;
};
