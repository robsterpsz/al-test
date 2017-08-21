'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getMarketStatus = exports.getTimeToOpen = exports.getApiTimeZone = exports.toMoment = exports.toLocal = undefined;

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _time = require('time');

var _time2 = _interopRequireDefault(_time);

var _loaded = require('timezone/loaded');

var _loaded2 = _interopRequireDefault(_loaded);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var strftime_format = '%F %T %z'; // used to convert a date into a normalized strftime format with timezone
var moment_format = 'YYYY-MM-DD HH:mm:ss zz'; // moment.js LDML format for parsing date strings

/**
 * Convert a Javascript Date into node-time wrapper with the appropriate timezone.
 * @param date     {Date}   Javascript Date object
 * @param timezone {String} Olson timezone for this date (e.g. 'America/New_York')
 * @return node-time object with the appropriate timezone
 */
var toLocal = exports.toLocal = function toLocal(date, timezone) {
  var tz_date = new _time2.default.Date(date);
  tz_date.setTimezone(timezone); // localize the date into the specified timezone
  return (0, _loaded2.default)(tz_date, strftime_format, timezone); // localized format w timezone offset
};

/**
 * Convert a Javascript Date into a Moment.js moment obj with the appropriate timezone.
 * Using the returned moment, you can call for example 'moment.calendar()' to get a
 * human readable relative time such as 'last Friday at 3:52 PM'.
 * @param date     {Date}   Javascript Date object
 * @param timezone {String} Olson timezone for this date (e.g. 'America/New_York')
 * @return moment with the appropriate timezone
 */
var toMoment = exports.toMoment = function toMoment(date, timezone) {
  var local_datetime = toLocal(date, timezone);
  return (0, _moment2.default)(local_datetime, moment_format);
};

/**
* Nasdaq opens at 09:30 and closes at 16:00 EDT from Monday to Friday
* NYSE opens at 09:30 and closes at 16:00 ET from Monday to Friday
* @return moment with the appropriate timezone
*/
var getApiTimeZone = exports.getApiTimeZone = function getApiTimeZone() {
  return toMoment(new Date(), 'America/New_York');
};
/**
*  @return a Moment.js duration object indicating time left to open trade market
*/
var getTimeToOpen = exports.getTimeToOpen = function getTimeToOpen() {
  var apiTimezone = getApiTimeZone();
  var day = apiTimezone.day();
  var hour = apiTimezone.hour();
  var refDate = toMoment(new Date(), 'America/New_York');
  refDate.set({ 'hour': 9, 'minute': 30, 'second': 0, 'millisecond': 0 });
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
var getMarketStatus = exports.getMarketStatus = function getMarketStatus() {
  var apiTimezone = getApiTimeZone();
  var openingDay = apiTimezone.day();
  var marketStatus = openingDay > 0 && openingDay < 6;
  if (marketStatus) {
    var openingHour = apiTimezone.hour();
    marketStatus = openingHour * 60 < 959;
    if (marketStatus) {
      var minutes = apiTimezone.minutes();
      marketStatus = openingHour * 60 + minutes > 569;
    }
  }
  return marketStatus;
};