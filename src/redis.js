import bluebird from 'bluebird';
import redis  from 'redis';

// import lie from 'lie'; // recycled from localforage dependency
// lie.all([redis.RedisClient.prototype]);
bluebird.promisifyAll(redis.RedisClient.prototype);

/**
 * redisPort is defined internally by Heroku
 * @type {Number} 6379 by default
 * @see https://redis.io/topics/config
 */
const redisPort = process.env.REDIS_PORT || 6379;
/**
 * redisHost is defined internally by Heroku
 * @type {String} '127.0.0.1' by default
 * @see https://redis.io/topics/config
 */
const redisHost = process.env.REDIS_HOST || '127.0.0.1';

/**
 * Redis client for Node.js
 * @see http://redis.js.org/#api-rediscreateclient
 */
export const redisClient = redis.createClient(redisPort, redisHost);
redisClient.on('error', function (e) {
  console.error('redisClient Error:', e);
});

/**
 * Returns all fields and values of the hash stored at key.
 * @param  {String} keyName Redis hash key name
 * @return {Array <String>} Every field name followed by its corresponding value
 * @see https://redis.io/commands/hgetall
 */
export const hgetallAsync = (keyName) => {
  const data = redisClient.hgetallAsync(keyName)
    .then((data) => { return data; })
    .catch((e) => { throw e; });
  return data;
};

/**
 * Get all fields and their associated values from a Redis hash.
 * @param  {Number} cursor Redis cursor
 * @param  {String} pattern Redis (regex) pattern
 * @param  {Set} returnSet Javascript set being queued recursively
 * @return {Array <String>} Every field value pair stored in the Redis hash
 * @see https://redis.io/commands/hscan
 */
export const scanAsync = (cursor, pattern, returnSet) => {
  return redisClient.scanAsync(cursor, 'MATCH', pattern, 'COUNT', '100').then(
    (reply) => {
      cursor = reply[0];
      const keys = reply[1];
      keys.forEach((key) => { returnSet.add(key); });
      if (cursor === '0') {
        return Array.from(returnSet);
      } else {
        return scanAsync(cursor, pattern, returnSet);
      }
    }).catch((e) => { throw e; });
};

/**
 * Asyn function that get all fields and their associated values from a Redis hash.
 * @param  {String} keyPattern Redis (regex) pattern.
 * @return {String} redisKeys Hash Redis key
 */
export const getRedisKeys = async (keyPattern) => {
  const keys = new Set();
  const redisKeys = await scanAsync('0', keyPattern, keys)
    .then((result) =>{ return result; })
    .catch((e) => { throw e; });
  return redisKeys;
};

/**
 * Async function that returns all fields and values of the hash stored at key.
 * @param  {String} redisKey Key name of the Redis hash
 * @return {Array <String>} All field value pairs stored in the Redis hash
 */
export const getRedisHash = async (redisKey) => {
  const redisHash = await hgetallAsync(redisKey)
    .then((hash) => { return hash; })
    .catch((e) => { throw e; });
  return redisHash;
};
