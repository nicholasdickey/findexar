
const { redis } = require('./redis');
const slugify = require('slugify');
const { l, chalk, microtime, allowLog } = require('./common');
const { dbProduct, dbReview, dbUserAuth, dbPublication, dbCategory, dbBrand } = require('./db');
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
const search = async ({ index, query }) => {
    console.log("search:", query)
    return await redis.ft_search({ index, query, page: 1, size: 25 })
}
const searchProduct = async ({ query }) => {
    console.log("search:", query)
    let rawResult = await redis.ft_search({ index: 'products', query: `%%%${query}%%%`, page: 1, size: 25 })
    //  let parts = stringProduct.split(',');
    let numResults = rawResult[0];
    let results = [];
    for (let i = 0; i < numResults; i++) {
        let result = {};
        result.slug = rawResult[1 + i * 2];
        let fields = rawResult[2 + i * 2];

        for (let j = 0; j < fields.length; j++) {
            result[fields[j]] = fields[++j];
        }
        results.push(result);
    }
    l(chalk.yellow("searchProduct:", JSON.stringify(results)));
    return results;
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
const authorize = async ({ query, token, goldenToken, username, sessionid, threadid }) => {
    let authorized = false;
    if (token == goldenToken) {
        authorized = true;
        username = "process";
    }

    if (!authorized) {
        const userInput = {
            slug: username
        }
        const action = 'fetch';

        let userResult = await dbUserAuth({ query, sessionid, threadid, user: userInput, username, action });
        if (['admin', 'ops'].indexOf(userResult.role) >= 0)
            authorized = true;
    }
    return authorized ? { username } : false;
}
const submitReview = async ({ review: raw, query, sessionid, threadid, username, ...other }) => {
    /*
    Verify access rights, either by username or token
    */
    let authOut = await authorize({ query, username, sessionid, threadid, ...other })
    if (!authOut)
        return {
            success: false,
            message: 'User not authorized to add review'
        }
    else {
        username = authOut.username;
    }
    let res;

    const {
        productName, productDescription, productUrl, productImage, vendorUrls,
        brandName, brandDescription, brandUrl, brandImage,
        nativeCategory,
        publicationSlug,
        title, description, url, author, avatar, cdn, stars, verified, location,
        micros

    } = raw;
    l(chalk.cyan("submitReview resolver", username, publicationSlug, JSON.stringify(raw, null, 4)))

    let slug = slugify(title, { lower: true })
    let review = {
        slug
    }
    const exist = await dbReview({ query, sessionid, threadid, review, username, action: 'fetch' });
    if (exist.success) {
        l(chalk.cyan("after fetch dbReview EXIST", JSON.stringify(exist)))
        return exist.review;
    }
    let productSlug = slugify(productName, { lower: true })
    let product = {
        slug: productSlug
    }
    res = await dbProduct({ query, sessionid, threadid, product, username, action: 'fetch' });
    l(chalk.cyan("after fetch product", JSON.stringify(res)))
    product = res.product;
    if (!product) {
        l(chalk.cyan("no product"))
        const publicationCategorySlug = slugify(nativeCategory, { lower: true })
        let categorySlug = `not-matched:${publicationSlug}:${publicationCategorySlug}`;
        let publication = {
            slug: publicationSlug,
            publicationCategorySlug
        }
        l(chalk.cyan(JSON.stringify({ categorySlug, publication })))
        res = await dbPublication({ query, sessionid, threadid, publication, username, action: 'fetchAssociatedCategory' });
        l(chalk.cyan(JSON.stringify({ action: 'fetchAssociatedCategory', res })))
        if (res.findexarCategorySlug) {
            categorySlug = res.findexarCategpry
        }
        else {
            let category = {
                slug: categorySlug,
                name: nativeCategory,
                parentSlug: "native"
            }
            res = await dbCategory({ query, sessionid, threadid, category, username, action: 'update' });
            if (res.success) {
                category = {
                    slug: res.slug,

                }
                res = await dbCategory({ query, sessionid, threadid, category, username, action: 'fetch' });
                if (res.success) {
                    category = res.category;
                    let fields = {
                        slug: category.slug,
                        name: category.name,
                        path: category.path,
                    }
                    await redis.ft_add({
                        index: 'categories',
                        slug: category.slug, fields
                    })
                }
                else {
                    return {
                        success: false,
                        message: `Resolver: Unable to access category. ${res.message}`
                    }
                }
            }
            else {
                return {
                    success: false,
                    message: `Resolver: Unable to store category. ${res.message}`
                }
            }
        }
        const brandSlug = slugify(brandName, { lower: true })
        let brand = {
            slug: brandSlug
        }
        res = await dbBrand({ query, sessionid, threadid, brand, username, action: 'fetch' });
        brand = res.brand;
        if (!brand) {
            brand = {
                slug: brandSlug,
                image: brandImage,
                imageSrc: brandImage,
                url: brandUrl,
                cdn: cdn,
                name: brandName,
                description: brandDescription
            }

            res = await dbBrand({ query, sessionid, threadid, brand, username, action: 'update' });
            if (!res.success)
                return {
                    success: false,
                    message: `Resolver: Unable to store brand. ${res.message}`
                }
            else {
                brand = {
                    slug: res.slug
                }
                res = await dbBrand({ query, sessionid, threadid, brand, username, action: 'fetch' });
                brand = res.brand;
            }
            l('have brand:', JSON.stringify(brand))
            /**
            * Index the brand
            */
            await redis.ft_add({
                index: 'brands', slug: brandSlug, fields: {
                    name: brand.name,
                    description: brand.description,
                    image: brand.image, url: brand.url
                }
            })

        }
        product = {
            slug: productSlug,
            categorySlug,
            name: productName,
            description: productDescription,
            image: productImage,
            imageSrc: productImage,
            productUrl,
            vendorUrls,
            brandSlug
        }
        res = await dbProduct({ query, sessionid, threadid, product, username, action: 'update' });

        if (!res.success) {
            return {
                success: false,
                message: `Resolver: Unable to store product. ${res.message}`
            }
        }
        else {
            let product = {
                slug: res.slug
            }

            res = await dbProduct({ query, sessionid, threadid, product, username, action: 'fetch' });

        }
        product = res.product;
        l(chalk.cyan("after fetch product", JSON.stringify(res.product, null, 4)))

        /**
         * Index the product
         */
        let fields = {
            name: product.name,
            description: product.description,
            brandSlug: product.brandSlug,
            categorySlug: product.categorySlug,
            image: product.image,
            productUrl: product.productUrl,
            vendorUrls: product.vendorUrls
        }

        await redis.ft_add({
            index: 'products',
            slug: product.slug, fields
        })
    }
    review = {
        slug
    }
    res = await dbReview({ query, sessionid, threadid, review, username, action: 'fetch' });
    //            title, description, rawSentimentScore, url, author, avatar, avatarSrc, stars, verified, location,

    if (!res.success) {
        review = {
            slug,
            productSlug,
            publicationSlug,
            title,
            description,
            url,
            author,
            avatar,
            avatarSrc: avatar,
            stars,
            verified,
            location,
            micros
        }
        res = await dbReview({ query, sessionid, threadid, review, username, action: 'update' });
        if (!res.success) {
            return {
                success: false,
                message: `Resolver: Unable to store review. ${res.message}`
            }
        }
        else {
            review = {
                slug: res.slug
            }
            res = await dbReview({ query, sessionid, threadid, review, username, action: 'fetch' });
            review = res.review;
            await redis.ft_add({
                index: 'reviews',
                slug: review.slug, fields: {
                    title: review.title,
                    description: review.description, productSlug: review.productSlug, publicationSlug: review.publicationSlug, author: review.author, fakespot: review.fakespot,
                    avatar: review.avatar, url: review.url, stars: review.stars, verified: review.verified, location: review.location
                }
            })
        }
    }
    review = res.review;

    return review;
}
const fetchPublication = async ({ publicationSlug, query, sessionid, threadid, username }) => {
    l(chalk.cyan(`fetchPublication(${publicationSlug})`));
    let publication = {
        slug: publicationSlug
    }
    res = await dbPublication({ query, sessionid, threadid, publication, username, action: 'fetch' });
    l(chalk.cyan(JSON.stringify({ action: 'fetch', res })))
    if (res.success)
        return res.publication
    else
        return {
            success: false,
            message: res.message
        }
}
const fetchProduct = async ({ productSlug, query, sessionid, threadid, username }) => {
    l(chalk.cyan(`fetchProduct(${productSlug})`));
    let product = {
        slug: productSlug
    }
    l(chalk.cyan(JSON.stringify({ productSlug })))
    res = await dbProduct({ query, sessionid, threadid, product, username, action: 'fetch' });
    l(chalk.cyan(JSON.stringify({ action: 'fetch', res })))
    if (res.success)
        return res.product
    else
        return {
            success: false,
            message: res.message
        }
}
const updatePublication = async ({ publication, query, sessionid, threadid, username }) => {
    const { slug, name, description, image, cdn, url, active, handler, crawlerEntryUrl, sentimentWedight } = publication;
    l(chalk.cyan(`fetchPublication(${slug})`));

    l(chalk.cyan(JSON.stringify({ publication })))
    let res = await dbPublication({ query, sessionid, threadid, publication, username, action: 'update' });
    l(chalk.cyan(JSON.stringify({ action: 'update', res })))
    if (res.success) {
        let publication = {
            slug: res.slug
        }
        l(chalk.cyan(JSON.stringify({ slug })))
        res = await dbPublication({ query, sessionid, threadid, publication, username, action: 'fetch' });
        l(chalk.cyan(JSON.stringify({ action: 'fetch', res })))

        if (res.success) {
            publication = res.publication;
            let fields = {
                slug: publication.slug,
                name: publication.name,
                description: publication.description,
                url: publication.url,
                image: publication.url
            }

            await redis.ft_add({
                index: 'publications',
                slug: publication.slug, fields
            })
            return publication
        }
        else
            return {
                success: false,
                message: res.message
            }
    }
    else
        return {
            success: false,
            message: res.message
        }
}













module.exports = { testRedis, search, searchProduct, submitReview, fetchPublication, fetchProduct, updatePublication }