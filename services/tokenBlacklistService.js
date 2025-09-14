const redisClient = require('../config/redis');

async function blacklistToken(jti, expirySeconds) {
    await redisClient.set(`blacklist:${jti}`, '1', 'EX', expirySeconds);
}

async function isTokenBlacklisted(jti) {
    const exists = await redisClient.get(`blacklist:${jti}`);
    return !!exists;
}

module.exports = { blacklistToken, isTokenBlacklisted };