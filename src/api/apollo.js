const { ApolloServer, gql } = require('apollo-server-express');
const { dbStart, dbEnd, dbCategory, dbPublication, dbProduct, dbBrand } = require('./db');
const { l, chalk, microtime, allowLog } = require('./common');
const { redis } = require('./redis');
const { search, searchProduct, submitReview, fetchPublication, fetchProduct, updatePublication } = require('./resolvers');


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
        findex:Int,
        fakespot:String,
        matched:Int
        productUrl:String
        vendorUrls:String
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
        slug:String
        productSlug:String
        title:String
        description:String
        stars:Stars
        sentimentScore:Int
        verified:Int
        fakespot:String,
        avatar:String,
        avatarSrc:String,
        url:String
        author:String
        created:String
        updated:String
        createdBy:String
        updatedBy:String
        micros:Int
        published:Int
        publicationSlug:String
        publication:Publication
        product:Product
    }
    
    type Publication{
        slug:ID
        url:String
        name:String
        imageSrc:String
        image:String
        sentimentWeight:Int,
        cdn:Int

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
        search(query:String):[Product]
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
    input RawReviewInput{
        productName:String!, 
        productDescription:String, 
        productUrl:String, 
        productImage:String, 
        vendorUrls:String,
        brandName:String!, 
        brandDescription:String, 
        brandUrl:String, 
        brandImage:String,
        nativeCategory:String!,
        publicationSlug:String!,
        title:String!, 
        description:String, 
        url:String, 
        author:String, 
        avatar:String, 
        stars:String, 
        verified:Int, 
        location:String,
        micros:Int
    }

    input PublicationInput{
        slug:ID
        url:String
        name:String
        imageSrc:String
        image:String
        sentimentWeight:Int,
        cdn:Int

    }
    type Mutation {
        submitReview(review:RawReviewInput):Review
        submitPublication(publication:PublicationInput):Publication
      }
  `;
/**
 * 
 * RESOLVERS
 * 
 * note, for mutations, micros is the timestamp. If the entity exist, it should only be updated for the newer timestamp
 */
/*const categoryMutation = (parent, args, context, info) => {
    const { category } = args;
    const { user, sqlClient, sessionid, threadid } = context;
    l(chalk.bold.magenta(JSON.stringify(info, null, 4)));

    //note, if slug is missing, action will become 'insert' automatically and the new slug generated out of name
    return dbCategory({ query: sqlClient.query, sessionid, threadid, category, username: user ? user.nickname : '', action: 'update' });
}*/
const submitReviewMutation = async (parent, args, context, info) => {
    l(chalk.green("submitReviewMutation START", JSON.stringify(args.review)))
    let { sqlClient, sessionid, threadid } = context;
    const ret = await submitReview({ query: sqlClient.query, review: args.review, sessionid, threadid });
    l(chalk.green("submitReviewMutation END", JSON.stringify(ret)))
    return ret;

}
const resolvePublication = async (parent, args, context, info) => {
    l(chalk.green("childPublicationMutation START", JSON.stringify(parent)))
    let { sqlClient, sessionid, threadid } = context;
    const ret = await fetchPublication({ publicationSlug: parent.publicationSlug, query: sqlClient.query, sessionid, threadid });
    l(chalk.green("childPublicationMutation END", JSON.stringify(ret)))
    return ret;

}
const resolveProduct = async (parent, args, context, info) => {
    l(chalk.green("childProductMutation START", JSON.stringify(parent)))
    let { sqlClient, sessionid, threadid } = context;
    const ret = await fetchProduct({ productSlug: parent.productSlug, query: sqlClient.query, sessionid, threadid });
    l(chalk.green("childProductMutation END", JSON.stringify(ret)))
    return ret;

}
const submitPublicationMutation = async (parent, args, context, info) => {
    l(chalk.green("submitPublicationMutation START", JSON.stringify(args.review)))
    let { sqlClient, sessionid, threadid } = context;
    const publication = args.publication;
    const ret = await updatePublication({ publication, query: sqlClient.query, sessionid, threadid });
    l(chalk.green("submitPublicationMutation END", JSON.stringify(ret)))
    return ret;

}
/*
const testMutation = async (parent, args, context, info) => {
    l(chalk.green("testMutation START", JSON.stringify(args.query)))
    const ret = await search({ query: args.query });
    l(chalk.green("testMutation END", ret))
    return `${ret}`;
}*/
const searchQuery = async (parent, args, context, info) => {
    l(chalk.green("searchMutation START"))
    const ret = await searchProduct({ query: args.query });
    l(chalk.green("searchMutation END", ret))
    return ret;
}
/*
const addProductMutation = async (parent, args, context, info) => {
    l(chalk.green("addProductMutation START"))
    const ret = await addProduct({ product: args.product });
    l(chalk.green("addProductMutation END", ret))
    return `${ ret } `;
}
*/


const resolvers = {
    Query: {
        search: searchQuery
    },
    Mutation: {
        submitReview: submitReviewMutation,
        submitPublication: submitPublicationMutation

    },
    Review: {
        publication: resolvePublication,
        product: resolveProduct
    }

};

// The ApolloServer constructor requires two parameters: your schema
// definition and your set of resolvers.
const testServer = async () => {
    const context = async ({ req }) => {
        allowLog();
        const time1 = microtime();
        const threadid = Math.floor(Math.random() * 10000);
        let goldenToken = await redis.get("golden-token");
        //   l(chalk.green.bold('CONTEXT CALLBACK'), { sessionID: req.sessionID, session: req.session, user: req.user ? req.user : 'unknown', goldenToken });

        return {
            threadid,
            time1,
            goldenToken
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
                    l(chalk.red("requestDidStart"));
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
    return server;
}
const register = async ({ app }) => {
    const context = async ({ req }) => {
        allowLog();
        const time1 = microtime();
        const threadid = Math.floor(Math.random() * 10000);
        let sqlClient = await dbStart();
        let goldenToken = await redis.get("golden-token");
        l(chalk.green.bold('CONTEXT CALLBACK'), { sessionID: req.sessionID, session: req.session, user: req.user ? req.user : 'unknown', goldenToken });

        return {

            sqlClient,
            threadid,
            sessionid: req.sessionID,
            session: req.session,
            user: req.user ? req.user : null,
            time1,
            goldenToken
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
module.exports = { apollo: register, testServer };