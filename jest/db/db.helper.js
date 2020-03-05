require("dotenv").config();
const { dbStart, dbEnd, dbCategory, dbProduct, dbBrand, dbPublication, dbReview, dbUserAuth } = require('../../src/api/db');
const sessionid = 'test-session';
const threadid = Math.floor(Math.random() * 10000);;
const initTest = async (server) => {
    const sqlClient = await dbStart(server);
    //console.log("initTest sqlClient:", sqlClient.query)
    const query = sqlClient.query;
    await query(`DELETE from users where createdBy=?`, ['tester']);
    await query(`DELETE from categories where createdBy=?`, ['tester']);
    await query(`DELETE from products where createdBy=?`, ['tester']);
    await query(`DELETE from brands where createdBy=?`, ['tester']);
    await query(`DELETE from reviews where createdBy=?`, ['tester']);
    await query(`DELETE from publications where createdBy=?`, ['tester']);
    await query(`DELETE from publicationCategories where createdBy=?`, ['tester']);
    await query(`DELETE from dblog where sessionid=?`, ['test-session']);

    return sqlClient;
}
const endTest = async (sqlClient) => {
    await dbEnd({ connection: sqlClient.connection });
    return
}
const storeUser = async ({ sqlClient, slug, role }) => {
    const { query } = sqlClient;
    const user = {
        slug,
        role
    }
    const username = "tester";
    const action = 'update';

    return await dbUserAuth({ query, sessionid, threadid, user, username, action });
}
const fetchUser = async ({ sqlClient, slug }) => {
    const { query } = sqlClient;
    const user = {
        slug
    }
    const username = "tester";
    const action = 'fetch';

    return await dbUserAuth({ query, sessionid, threadid, user, username, action });
}
//slug, name, description, image, imageSrc, url, cdn, micros
const storeBrand = async ({ sqlClient, slug, image, imageSrc, url, cdn, name, description }) => {
    const { query } = sqlClient;
    const brand = {
        slug,
        image,
        imageSrc,
        url,
        cdn,
        name,
        description
    }
    const username = "tester";
    const action = 'update';

    return await dbBrand({ query, sessionid, threadid, brand, username, action });
}
// slug, name, description, image, imageSrc, cdn, url, active, handler, crawlerEntryUrl, lastCrawled, micros, publicationCategorySlug, findexarCategprySlug
const storePublication = async ({ sqlClient, slug, image, imageSrc, url, cdn, name, description, active, handler, crawlerEntryUrl }) => {
    const { query } = sqlClient;
    const publication = {
        slug,
        image,
        imageSrc,
        url,
        active,
        cdn,
        name,
        handler,
        crawlerEntryUrl,
        description
    }
    const username = "tester";
    const action = 'update';

    return await dbPublication({ query, sessionid, threadid, publication, username, action });
}

const storeReview = async ({ sqlClient, slug, image, imageSrc, url, cdn, title, description, published, publicationSlug, productSlug, stars, fakespot, verified, sentimentScore, author, active }) => {
    const { query } = sqlClient;
    const review = {
        slug,
        image,
        imageSrc,
        url,
        active,
        cdn,
        title,
        published, publicationSlug, productSlug, stars, fakespot, verified, sentimentScore, author,
        description
    }
    const username = "tester";
    const action = 'update';

    return await dbReview({ query, sessionid, threadid, review, username, action });
}
const fetchReviews = async ({ sqlClient, productSlug }) => {
    const { query } = sqlClient;
    const review = {
        productSlug
    }
    const username = "tester";
    const action = 'fetchByProduct';

    return await dbReview({ query, sessionid, threadid, review, username, action });
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
const storeProduct = async ({ sqlClient, slug, categorySlug, name, description, image, imageSrc, sentiment, fakespot, findex, productUrl, vendorUrls, brandSlug }) => {
    const { query } = sqlClient;
    const product = {
        slug,
        categorySlug,
        name,
        description,
        sentiment,
        fakespot,
        findex,
        image,
        imageSrc,
        productUrl,
        vendorUrls,
        brandSlug
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
const updateProductSentiment = async ({ sqlClient, slug, sentiment, findex }) => {
    const { query } = sqlClient;
    const product = {
        slug,
        sentiment,
        findex
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
module.exports = {
    initTest, endTest, storeCategory, fetchCategoryChildren, removeCategory, fetchCategory, storeProduct,
    replaceProductCategory, updateProductSentiment, fetchProduct, fetchProductsByCategory
    , storeBrand, storePublication, storeReview, fetchReviews,
    storeUser, fetchUser
}