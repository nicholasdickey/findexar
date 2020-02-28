// ./src/api/redis.js

var Redis = require('ioredis');

const redisServer = process.env.REDIS_SERVER;
const redisPort = process.env.REDIS_PORT;
const redisName = process.env.REDIS_NAME;
redis = new Redis(redisPort, redisServer, { connectionName: redisName });
pubsub = new Redis(redisPort, redisServer, { connectionName: `${redisName}Pubsub` });

module.exports = { redis, pubsub }
