const { dbStart, dbEnd, dbCategory, dbProduct } = require('../../src/api/db');
const sessionid = 'test-session';
const threadid = Math.floor(Math.random() * 10000);;
const initTest = async () => {
    const sqlClient = await dbStart();
    //console.log("initTest sqlClient:", sqlClient.query)
    const query = sqlClient.query;
    await query(`DELETE from categories where createdBy=?`, ['tester']);
    await query(`DELETE from products where createdBy=?`, ['tester']);
    await query(`DELETE from dblog where sessionid=?`, ['test-session']);

    return sqlClient;
}
const endTest = async (sqlClient) => {
    await dbEnd({ connection: sqlClient.connection });
    return
}
const storeCategory = async ({ sqlClient, slug, parentSlug, name, description }) => {
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
const fetchCategoryChildren = async ({ sqlClient, slug }) => {
    const { query } = sqlClient;
    const category = {
        slug,

    }
    const username = "tester";
    const action = 'fetchChildren';

    return await dbCategory({ query, sessionid, threadid, category, username, action });
}

const removeCategory = async ({ sqlClient, slug }) => {
    const { query } = sqlClient;
    const category = {
        slug,
    }
    const username = "tester";
    const action = 'remove';

    return await dbCategory({ query, sessionid, threadid, category, username, action });
}
const fetchCategory = async ({ sqlClient, slug }) => {
    const { query } = sqlClient;
    const category = {
        slug,
    }
    const username = "tester";
    const action = 'fetch';

    return await dbCategory({ query, sessionid, threadid, category, username, action });
}
const storeProduct = async ({ sqlClient, slug, categorySlug, name, description, image, imageSrc, sentiment, itemUrl, manufUrl }) => {
    const { query } = sqlClient;
    const product = {
        slug,
        categorySlug,
        name,
        description,
        sentiment,
        image,
        imageSrc,
        itemUrl,
        manufUrl
    }
    const username = "tester";
    const action = 'update';

    return await dbProduct({ query, sessionid, threadid, product, username, action });
}
const replaceProductCategory = async ({ sqlClient, slug, categorySlug, oldCategorySlug }) => {
    const { query } = sqlClient;
    const product = {
        slug,
        categorySlug,
        oldCategorySlug
    }
    const username = "tester";
    const action = 'replaceCategory';

    return await dbProduct({ query, sessionid, threadid, product, username, action });
}
const updateProductSentiment = async ({ sqlClient, slug, sentiment }) => {
    const { query } = sqlClient;
    const product = {
        slug,
        sentiment
    }
    const username = "tester";
    const action = 'updateSentiment';

    return await dbProduct({ query, sessionid, threadid, product, username, action });
}
const fetchProduct = async ({ sqlClient, slug }) => {
    const { query } = sqlClient;
    const product = {
        slug

    }
    const username = "tester";
    const action = 'fetch';

    return await dbProduct({ query, sessionid, threadid, product, username, action });
}
const fetchProductsByCategory = async ({ sqlClient, categorySlug }) => {
    const { query } = sqlClient;
    const product = {
        categorySlug

    }
    const username = "tester";
    const action = 'fetchByCategory';

    return await dbProduct({ query, sessionid, threadid, product, username, action });
}
module.exports = { initTest, endTest, storeCategory, fetchCategoryChildren, removeCategory, fetchCategory, storeProduct, replaceProductCategory, updateProductSentiment, fetchProduct, fetchProductsByCategory }