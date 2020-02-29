
const chalk = require('chalk');
chalk.enabled = true;
let lg = false;
const allowLog = () => lg = true;
const l = (...args) => {
    if (lg) {
        console.log(...args);
    }
}

const microtime = () => Math.abs((new Date).getTime())

function logTime({ t1, threadid, name }) {

    const t2 = microtime(true);
    l(chalk.green(`API RETURN ${name}(${threadid}):${(t2 - t1)} ms`));
}
function logEnter(name, url) {
    const threadid = Math.floor(Math.random() * 10000);
    const t1 = microtime(true);
    l(chalk.blue(`API ENTER ${name}(${threadid})`), { url });
    return { threadid, t1, name };

}
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { allowLog, l, chalk, microtime, logTime, logEnter, sleep }