// ./src/api/redis.js
const { l, chalk } = require('./common');
const redis = require("redis");
redisearch = require('redis-redisearch');
redisearch(redis);
//const client = redisearch.createClient();

const redisServer = process.env.REDIS_SERVER;
const redisPort = process.env.REDIS_PORT;
const redisName = process.env.REDIS_NAME;
const redisClient = redis.createClient(redisPort, redisServer)
redisClient.on("error", function (error) {
    console.error(error);
});

//redis = new Redis(redisPort, redisServer, { connectionName: redisName });
//pubsub = new Redis(redisPort, redisServer, { connectionName: `${redisName}Pubsub` });

const redisC = {
    set: async (key, value) => {
        return new Promise((resolve, reject) => {
            return redisClient.set(key, value, (err, res) => {
                l(chalk.cyan(`REDIS: SET[${key},${value}]=${res}`))
                return resolve(res);
            });
        })

    },
    get: async (key) => {
        return new Promise((resolve, reject) => {
            return redisClient.get(key, (err, res) => {
                l(chalk.cyan(`REDIS: GET[${key}]=${res}`))
                return resolve(res);
            });
        })
    },
    ft_create: async ({ index, schema }) => {
        return new Promise((resolve, reject) => {
            return redisClient.ft_create(index, ...schema, (err, res) => {
                if (err) {

                    l(chalk.red.bold("REDIS ERROR:", err));
                }
                l(chalk.cyan(`REDIS: FT.CREATE[${index},${schema}]=${res}`))
                return resolve(res);
            });
        })
    },
    ft_add: async ({ index, slug, title, description, brand, category }) => {
        return new Promise((resolve, reject) => {
            return redisClient.ft_add(index, slug, 1, 'FIELDS', 'title', title, 'description', description, 'brand', brand, 'category', category, (err, res) => {
                if (err) {

                    l(chalk.red.bold("REDIS ERROR:", err));
                }
                l(chalk.cyan(`REDIS: FT.ADD[${index},${slug},${title},${description}]=${res}`))
                return resolve(res);
            });
        })
    },
    ft_search: async ({ index, query, page, size }) => {
        return new Promise((resolve, reject) => {
            let start = (page - 1) * size;
            return redisClient.ft_search(index, query, 'LIMIT', start, size, (err, res) => {
                if (err) {

                    l(chalk.red.bold("REDIS ERROR:", err));
                }
                l(chalk.cyan(`REDIS: FT.SEARCH[${index},${`"${query}"`},${page},${size}]=${res}`))
                return resolve(res);
            });
        })
    }


}

module.exports = { redis: redisC }
