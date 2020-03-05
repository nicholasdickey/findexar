require("dotenv").config();
const { testServer } = require('../../src/api/apollo');

const { l, chalk } = require('../../src/api/common')
const { dbStart, dbEnd } = require('../../src/api/db');
const sessionid = 'test-ql-session';
const threadid = Math.floor(Math.random() * 10000);
const { createTestClient } = require('apollo-server-testing');
let apolloQuery;
let apolloMutate;
const initTest = async (server) => {
    let apollo = await testServer();
    l('apollo:', JSON.stringify(apollo.config.typeDefs, null, 4))
    const { query: localQuery, mutate: localMutate } = createTestClient(apollo);
    apolloQuery = localQuery;
    apolloMutate = localMutate;
    const sqlClient = await dbStart(server);
    //console.log("initTest sqlClient:", sqlClient.query)
    const query = sqlClient.query;
    await query(`DELETE from categories where slug=?`, ['not-matched:test-amazon:things-and-stuff']);
    await query(`DELETE from products where brandSlug=?`, ['test-brand']);
    await query(`DELETE from brands where slug=?`, ['test-widgy-factory']);
    await query(`DELETE from reviews where publicationSlug=?`, ['test-amazon']);
    await query(`DELETE from publications where slug=?`, ['test-amazon']);
    await query(`DELETE from publicationCategories where publicationSlug=?`, ['test-amazon']);
    await query(`DELETE from dblog where sessionid=?`, ['test-ql-session']);

    return sqlClient;
}
const endTest = async (sqlClient) => {
    await dbEnd({ connection: sqlClient.connection });
    return
}
const qlQuery = async (q) => {
    const res = await apolloQuery(q)
    return res;

}
const qlMutate = async (q) => {
    const res = await apolloMutate(q)
    return res;
}
module.exports = {
    initTest, endTest, qlQuery, qlMutate
}