const { dbStart, dbEnd, dbCategory } = require('../../src/api/db');
const sessionid = 'test-session';
const threadid = Math.floor(Math.random() * 10000);;
const initTest = () => {
    return dbStart();
}
const endTest = (sqlClient) => {
    return dbEnd(sqlClient.connection);
}
const createCategory = async ({ sqlClient, slug, parentSlug, name, description }) => {
    const { query } = sqlClient;
    const category = {
        slug,
        parentSlug,
        name,
        description
    }
    const username = "tester";
    const action = 'update';

    return await dbCategory({ query, sessionid, threadid, category, username, action });
}
const updateCategory = ({ sqlClient, query, slug, name, description, micros }) => {

}
module.exports = { initTest, endTest, createCategory }