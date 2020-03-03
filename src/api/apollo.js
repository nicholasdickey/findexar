const { ApolloServer, gql } = require('apollo-server-express');
const { dbStart, dbEnd, dbCategory, dbPublication, dbProduct, dbBrand } = require('./db');
const { l, chalk, microtime } = require('./common');

const { testRedis, search, addProduct, addReview } = require('./resolvers');


// A schema is a collection of type definitions (hence "typeDefs")
// that together define the "shape" of queries that are executed against
// your data.
const typeDefs = gql`
    # Comments in GraphQL strings (such as this one) start with the hash (#) symbol.

    # This "Book" type defines the queryable fields for every book in our data source.
    type Book {
    title: String
    author: String
    }

    # The "Query" type is special: it lists all of the available queries that
    # clients can execute, along with the return type for each. In this
    # case, the "books" query returns an array of zero or more Books (defined above).
   
    type Sentiment{
        index:Int
        rating:String
    }
    type Product {
        slug:ID
        name:String
        description:String
        imageSrc:String
        image:String
        sentiment:Sentiment
        sentimentScore:Int
        itemUrl:String
        manufUrl:String
        created:String
        updated:String
        createdBy:String
        updatedBy:String
        micros:Int
        category:Category
        brand:Brand
        reviews:[Review]
    }
    type Stars {
        value:Float
        total:Float
    }
    type Review {
        slug:ID
        product:Product!
        title:String
        description:String
        sentiment:Sentiment
        sentimentScore:Int
        url:String
        author:String
        created:String
        updated:String
        createdBy:String
        updatedBy:String
        micros:Int
        published:Boolean
        publication:Publication!
    }
    
    type Publication{
        slug:ID
        url:String
        name:String
        imageSrc:String
        image:String
        sentimentWeight:Int

    }
    
    type Category{
        slug:ID
        parent:Category
        name:String
        description:String
        created:String
        updated:String
        createdBy:String
        updatedBy:String
        micros:Int
        products:[Product]
    }
    type Brand{
        slug:ID
        name:String
        description:String
        imageSrc:String
        image:String
        created:String
        micros:Int
        url:String
    }

    ### Queries
    type Query {
        unmappedCategories(page:Int,size:Int):[Category]
        categories(slug:String, query:String):[Category]
        products(slug:String,query:String):[Product]
        reviews(slug:String, query:String ):[Review],
        brands(slug:String, query:String ):[Brand]
        books:[Book]
    }

    ### Mutation

    input CategoryInput{
        parentSlug:ID
        slug:ID
        name:String
        description:String
        micros:Int
    }
    input ProductInput{
        slug:ID
        name:String
        description:String
        image:String
        needCDN:Boolean
        itemUrl:String
        brandSlug:ID
        productSlug:ID
        micros:Int
    }
    input BrandInput{
        slug:ID
        name:String
        description:String
        image:String
        needCDN:Boolean
        url:String
        micros:Int
    }
    input ReviewInput{
        slug:ID
        productSlug:ID
        publicationCategorySlug:ID
        categorySlug:ID
        title:String
        description:String
        rawSentimentScore:Int
        sentimentScore:Int
        url:String
        author:String
        avatar:String
        avatarSrc:String
        stars:Stars
        verified:Boolean
        location:String
        published:Boolean
        publicationSlug:ID
        micros:Int
    }

    input RawReviewInput{
        productName:String
        productDescription:String
        brandName:String
        brandDescription:String
        publicationName:String
        title:String
        description:String
        rawSentimentScore:Int
        url:String
        author:String
        avatar:String
        avatarSrc:String
        stars:Stars
        verified:Boolean
        location:String
        micros:Int
    }
    type Mutation {
        submitReview(review:RawReviewInput):Review
        addCategory(category:CategoryInput):Category
        brand(brand:BrandInput):Brand
        product(product:ProductInput):Product
        review(review:ReviewInput):Review
        test(query:String):String
        search(query:String):Product
        addProduct(product:ProductInput):Product
        addReview(review:RawReviewInput):Review
    }
  `;
/**
 * 
 * RESOLVERS
 * 
 * note, for mutations, micros is the timestamp. If the entity exist, it should only be updated for the newer timestamp
 */
const categoryMutation = (parent, args, context, info) => {
    const { category } = args;
    const { user, sqlClient, sessionid, threadid } = context;
    l(chalk.bold.magenta(JSON.stringify(info, null, 4)));

    //note, if slug is missing, action will become 'insert' automatically and the new slug generated out of name
    return dbCategory({ query: sqlClient.query, sessionid, threadid, category, username: user ? user.nickname : '', action: 'update' });


}
const submitReview = (parent, args, context, info) => {

}
const brandMutation = (parent, args, context, info) => {

}
const productMutation = (parent, args, context, info) => {

}
const reviewMutation = (parent, args, context, info) => {

}
const testMutation = async (parent, args, context, info) => {
    l(chalk.green("testMutation START"))
    const ret = await search(args.query);
    l(chalk.green("testMutation END", ret))
    return `${ret}`;
}
const searchMutation = async (parent, args, context, info) => {
    l(chalk.green("searchMutation START"))
    const ret = await search({ query: args.query });
    l(chalk.green("searchMutation END", ret))
    return `${ret}`;
}
const addProductMutation = async (parent, args, context, info) => {
    l(chalk.green("addProductMutation START"))
    const ret = await addProduct({ product: args.product });
    l(chalk.green("addProductMutation END", ret))
    return `${ret}`;
}
const addReviewMutation = async (parent, args, context, info) => {
    l(chalk.green("addReviewMutation START"))
    const { user, sqlClient, sessionid, threadid } = context;

    const ret = await addReview({ review: args.review, query: sqlClient.query, sessionid, threadid, username: user ? user.nickname : '' });
    l(chalk.green("addReviewMutation END", ret))
    return `${ret}`;
}

const books = [
    {
        title: 'Harry Potter and the Chamber of Secrets',
        author: 'J.K. Rowling',
    },
    {
        title: 'Jurassic Park',
        author: 'Michael Crichton',
    },
];
let products = {};
let items = {};
let brands = {};
let reviews = {};
let itemProduct = {}
let productItem = {}
let reviewItem = {}
let itemReview = {}
let itemBrand = {}
let reviewPublication = {}
let publicationReview = {}

// Resolvers define the technique for fetching the types defined in the
// schema. This resolver retrieves books from the "books" array above.
const resolvers = {
    Query: {
        categories: (parent, args, context, info) => products,
        products: (parent, args, context, info) => items,
        reviews: (parent, args, context, info) => reviews,
        brands: (parent, args, context, info) => brands,
        books: (parent, args, context, info) => { console.log("QUERY books"); return books }
    },
    Mutation: {
        test: testMutation,
        submitReview,
        addCategory: categoryMutation,
        product: (parent, args, context, info) => {


        },
        brand: (parent, args, context, info) => {

        },
        review: (parent, args, context, info) => {

        },

    }
};

// The ApolloServer constructor requires two parameters: your schema
// definition and your set of resolvers.
const register = async ({ app }) => {
    const context = async ({ req }) => {
        const time1 = microtime();
        const threadid = Math.floor(Math.random() * 10000);
        let sqlClient = await dbStart();
        l(chalk.green.bold('CONTEXT CALLBACK'), { sessionID: req.sessionID, session: req.session, user: req.user ? req.user : 'unknown' });

        return {

            sqlClient,
            threadid,
            sessionid: req.sessionID,
            session: req.session,
            user: req.user ? req.user : null,
            time1
        }
    };
    const server = new ApolloServer({
        typeDefs,
        resolvers,
        tracing: true,
        context,
        plugins: [
            {
                requestDidStart: (() => {
                    // l(chalk.red("requestDidStart"));
                    return {

                        willSendResponse: response => {
                            const { time1, threadid, sqlClient } = response.context;
                            if (time1) {
                                l(chalk.blue.bold(threadid, ": graphQL request completed:", microtime() - time1, 'mks'));
                            }
                            if (sqlClient) {
                                dbEnd({ connection: sqlClient.connection });
                            }
                        },
                    };
                }),
            }
        ],
    });
    l(chalk.yellow("server created"));
    server.applyMiddleware({ app });
    l(chalk.yellow("applyMiddleware"))
}
module.exports = register;