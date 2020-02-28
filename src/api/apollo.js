const { ApolloServer, gql } = require('apollo-server-express');
const { dbStart, dbEnd, dbCategory } = require('./db');
const { l, chalk, microtime } = require('./common');


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
        level:Float
        percentile:Float
    }
    type Product {
        slug:ID
        name:String
        description:String
        imageSrc:String
        image:String
        sentiment:Sentiment
        itemUrl:String
        createdTime:String
        micros:Int
        category:Category
        brand:Brand
        reviews:[Review]
    }
   
    type Review {
        slug:ID
        product:Product!
        title:String
        description:String
        sentiment:Sentiment
        url:String
        author:String
        createdTime:String
        micros:Int
        published:Boolean
        publication:[Publication]!
    }
    
    type Publication{
        slug:ID
        url:String
        name:String
        imageSrc:String
        image:String
        sentimentWeight:Float

    }
    type MetatagPath{
        components:[String]
    }
    type Category{
        slug:ID
        path:MetatagPath
        name:String
        description:String
        url:String
        imageSrc:String
        image:String
        createdTime:String
        micros:Int
        products:[Product]
    }
    type Brand{
        slug:ID
        path:MetatagPath
        name:String
        description:String
        imageSrc:String
        image:String
        createdTime:String
        micros:Int
        products:[Product]
        url:String
    }

    ### Queries
    type Query {
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
        itemSlug:ID
        title:String
        description:String
        sentimentLevel:Float
        url:String
        author:String
        published:Boolean
        publicationSlug:ID
        micros:Int
    }
    type Mutation {
        addCategory(category:CategoryInput):Category
        brand(brand:BrandInput):Brand
        product(product:ProductInput):Product
        review(review:ReviewInput):Review
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
const brandMutation = (parent, args, context, info) => {

}
const productMutation = (parent, args, context, info) => {

}
const reviewMutation = (parent, args, context, info) => {

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