// ./src/thoughts-api.js

const bodyParser = require("body-parser");
const express = require("express");

const sync = require('./sync');
const intake = require('./intake')
const { redis } = require('./redis')
const { chalk, l, logTime, logEnter } = require('./common');
const router = express.Router();

router.use(bodyParser.json());
let syncRunning = false
async function syncup() {
    if (!syncRunning) {
        syncRunning = true;
        let item = null;
        let syncKey = 'sync-items';

        try {
            item = await redis.lpop(syncKey);
            await sync({ item });

        }
        catch (x) {
            if (item)
                await redis.lpush(syncKey, item); // a transact-like behavior on abort
            console.log(x);
        }

        syncRunning = false;
    }
}
let intakeRunning = false
async function intakeup() {
    if (!intakeRunning) {
        intakeRunning = true;
        try {

        }
        catch (x) {

        }

        intakeRunning = false;
    }
}
router.get("/api/health-check", (req, res) => {
    syncup();
    intakeup();
    res.send({ health: 'good' });

})
module.exports = router;