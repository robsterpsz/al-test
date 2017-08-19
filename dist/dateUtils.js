'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.toMoment = exports.toLocal = undefined;

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