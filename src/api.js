// ./src/thoughts-api.js

const bodyParser = require("body-parser");
const express = require("express");

const router = express.Router();

router.use(bodyParser.json());
router.get("/api/test", (req, res) => {
    res.send({ test: 'test' });

})
module.exports = router;