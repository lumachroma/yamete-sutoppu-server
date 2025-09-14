const Redis = require('ioredis');
if (!process.env.REDIS_URL) {
  throw new Error('REDIS_URL environment variable is not set.');
}
const redisClient = new Redis(process.env.REDIS_URL);
redisClient.on('connect', () => console.log('Redis connected'));
redisClient.on('error', err => console.error('Redis error', err));
module.exports = redisClient;