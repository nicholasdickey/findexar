// ./src/api/redis.js
const { l, chalk } = require('./common');
const redis = require("redis");
redisearch = require('redis-redisearch');
redisearch(redis);
//const client = redisearch.createClient();

const redisServer = process.env.REDIS_SERVER;
const redisPort = process.env.REDIS_PORT;
const redisName = process.env.REDIS_NAME;
console.log(chalk.green("creating redisClient:", JSON.stringify({ redisPort, redisServer })))
const redisClient = redis.createClient(redisPort, redisServer)
redisClient.on("error", function (error) {
    console.error(error);
});
l(chalk.green("created redisClient:", { redisPort, redisServer }))
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
    ft_drop: async ({ index }) => {
        return new Promise((resolve, reject) => {
            return redisClient.ft_drop(index, (err, res) => {
                if (err) {
                    l(chalk.red.bold("REDIS ERROR:", err));
                }
                l(chalk.cyan(`REDIS: FT.DROP[${index}]=${res}`))
                return resolve(res);
            });
        })
    },
    ft_add: async ({ index, slug, fields }) => {
        let fieldsArray = [];
        let keys = Object.keys(fields);
        keys.forEach(key => {
            fieldsArray.push(key);
            fieldsArray.push(fields[key]);
        })

        return new Promise((resolve, reject) => {
            return redisClient.ft_add(index, slug, 1, 'FIELDS', ...fieldsArray, (err, res) => {
                if (err) {
                    l(chalk.red.bold("REDIS ERROR:", err));
                }
                l(chalk.cyan(`REDIS: FT.ADD[${index},${slug},${JSON.stringify({ fields })},${JSON.stringify({ fieldsArray })}]=${res}`))
                return resolve(res);
            });
        })
    },
    ft_search: async ({ index, query, page, size }) => {
        return new Promise((resolve, reject) => {
            let start = (page - 1) * size;
            l(chalk.red.bold("REDIS SEARCH:", index, query, start, size));

            return redisClient.ft_search(index, query, 'LIMIT', start, size, (err, res) => {
                if (err) {

                    l(chalk.red.bold("REDIS ERROR:", err));
                }
                l(chalk.cyan(`REDIS: FT.SEARCH[${index}, ${`"${query}"`}, ${page}, ${size}]=${res}`))
                return resolve(res);
            });
        })
    }


}

module.exports = { redis: redisC }
