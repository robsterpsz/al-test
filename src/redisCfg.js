import bluebird from 'bluebird';
import redis  from 'redis';

bluebird.promisifyAll(redis.RedisClient.prototype);

const redisPort = process.env.REDIS_PORT || 6379;
const redisHost = process.env.REDIS_HOST || '127.0.0.1';

export const redisClient = redis.createClient(redisPort, redisHost);
redisClient.on('error', function (e) {
  console.error('redisClient Error:', e);
});

export const hgetallAsync = (keyName) => {
  return redisClient.hgetallAsync(keyName)
  .then((data) => { return data })
  .catch((e) => { throw e });
}

export const scanAsync = (cursor, pattern, returnSet) => {
  return redisClient.scanAsync(cursor, "MATCH", pattern, "COUNT", "100").then(
    (reply) => {
      cursor = reply[0];
      const keys = reply[1];
      keys.forEach((key) => { returnSet.add(key) });
      if (cursor === '0') {
        return Array.from(returnSet);
      } else {
        return scanAsync(cursor, pattern, returnSet)
      }
  }).catch((e) => { throw e });
}

export const getRedisKeys = async (keyPattern) => {
  const keys = new Set();
  const redisKeys = await scanAsync('0', keyPattern, keys)
  .then((result) =>{ return result })
  .catch((e) => { throw e });
  return redisKeys;
};

export const getRedisHash = async (redisKey) => {
  const redisHash = await hgetallAsync(redisKey)
    .then((hash) => { return hash })
    .catch((e) => { throw e });
  return redisHash;
};
