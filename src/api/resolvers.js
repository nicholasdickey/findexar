
const { redis } = require('./redis');
const slugify = require('slugify');
const { dbProduct, dbReview } = require('./db');
const testRedis = async (query) => {
    await redis.ft_create({ index: 'findexar', schema: ["SCHEMA", "title", "TEXT", "WEIGHT", 2, "description", "TEXT", "WEIGHT", 1.2, "brand", "TEXT", "category", "TEXT"] });
    await redis.ft_add({
        index: 'findexar', slug: 'test-slug', title: 'This is the first test tile',
        description: 'Could be a vacuum cleaner or garbage disposal', brand: 'Sears', category: 'appliances'
    })
    console.log("search:", query)
    return await redis.ft_search({ index: 'findexar', query, page: 1, size: 25 })
    //await redis.set('test-key', num);
    //return await redis.get('test-key');
}
const search = async ({ query }) => {
    console.log("search:", query)
    return await redis.ft_search({ index: 'findexar', query, page: 1, size: 25 })
}
const addProduct = async ({ title, description, brand, category }) => {
    let slug = slugify(title, { lower: true })
    return await redis.ft_add({
        index: 'findexar', slug, title,
        description, brand, category
    })
}
/**
 *      productName:String
        productDescription:String
        productImage:String
        brandName:String
        brandDescription:String
        brandUrl:String
        brandImage:String
        publicationSlug
        category:String
        title:String
        description:String
        rawSentimentScore:Int
        url:String
        author:String
        avatar:String
        stars:Stars
        verified:Boolean
        location:String
        cdn:Boolean
        micros:Int
 */
const addReview = async ({ review: raw, query, sessionid, threadid, username, token }) => {
    /*
    Verify access rights, either by username or token
    */
    const {
        sqlClient,
        productName, productDescription, productUrl,
        brandName, brandDescription, brandUrl, brandImage,
        publicationSlug,
        title, description, rawSentimentScore, url, author, avatar, avatarSrc, stars, verified, location,
        micros

    } = raw;
    let slug = slugify(title, { lower: true })
    const review = {
        slug
    }
    const exist = await dbReview({ query, sessionid, threadid, review, username, action: 'fetch' });
    if (exist) {
        return exist;
    }
    let productSlug = slugify(productName, { lower: true })
    let product = {
        slug: productSlug
    }
    const existProduct = await dbProduct({ query, sessionid, threadid, product, username, action: 'fetch' });
    if (!existProduct) {
        const brandSlug = slugify(brandName, { lower: true })
        let brand = {
            slug: brandSlug
        }
        const existBrand = await dbProduct({ query, sessionid, threadid, brand, username, action: 'fetch' });
        if (!existBrand) {
            brand = {
                slug: brandSlug,
                image: brandImage,
                imageSrc: brandImage,
                url: brandUrl,
                cdn: cdn,
                name: brandName,
                description: brandDescription
            }
        }
        product = {
            slug: productSlug,
            categorySlug,
            name,
            description,
            sentiment,
            sentimentScore,
            image,
            imageSrc,
            itemUrl,
            manufUrl,
            brandSlug
        }
        const newProduct = await dbProduct({ query, sessionid, threadid, product, username, action: 'update' });

    }


    return await redis.ft_add({
        index: 'findexar', slug, title,
        description, brand, category
    })
}













module.exports = { testRedis, search, addProduct, addReview }