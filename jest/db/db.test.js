/* eslint-env jest */
const { l, allowLog, sleep } = require('../../src/api/common')
const {
    initTest,
    endTest,
    storeCategory,
    fetchCategoryChildren,
    removeCategory,
    fetchCategory,
    storeProduct,
    replaceProductCategory,
    updateProductSentiment,
    fetchProduct,
    fetchProductsByCategory,
    storeBrand,
    storePublication,
    storeReview,
    fetchReviews,
    storeUser,
    fetchUser

} = require('./db.helper')

test('testing categories', async () => {
    // allowLog();

    //console.log = jest.fn()
    //expect(console.log).toHaveBeenCalled();
    //  const { output, expected } = await testCommentsFetchPage0();
    // console.log("post test")

    let leftSide = {};
    let rightSide = {};
    const sqlClient = await initTest();
    const parentCategory = { slug: 'parent-test-category', parentSlug: '', name: 'Top Parent Test Category', description: 'A Root Category for Testing' }
    const parentCategoryResult = await storeCategory({ sqlClient, ...parentCategory });
    leftSide.parentCategoryResult = {
        success: true,
        slug: 'parent-test-category'
    }
    rightSide.parentCategoryResult = parentCategoryResult;
    const testCategory1 = { slug: 'test-category1', parentSlug: 'parent-test-category', name: 'Test Category One', description: 'A Category 1 for Testing' }
    const testCategory1Result = await storeCategory({ sqlClient, ...testCategory1 });
    leftSide.testCategory1Result = {
        success: true,
        slug: 'test-category1'
    }
    rightSide.testCategory1Result = testCategory1Result;

    const testCategory2 = { slug: 'test-category2', parentSlug: 'parent-test-category', name: 'Test Category Two', description: 'A Category 2 for Testing' }
    const testCategory2Result = await storeCategory({ sqlClient, ...testCategory2 });
    leftSide.testCategory2Result = {
        success: true,
        slug: 'test-category2'
    }
    rightSide.testCategory2Result = testCategory2Result;



    const testCategory3 = { parentSlug: 'parent-test-category', name: 'Test Category Three', description: 'A Category 3 for Testing' }
    const testCategory3Result = await storeCategory({ sqlClient, ...testCategory3 });
    leftSide.testCategory3Result = {
        success: true,
        slug: 'test-category-three'
    }
    rightSide.testCategory3Result = testCategory3Result;



    const removeParentResult = await removeCategory({ sqlClient, slug: 'parent-test-category' });
    leftSide.removeParentResult = {
        success: false,
        message: "Unable to delete category: still has children"
    }
    rightSide.removeParentResult = removeParentResult;
    const testCategory3UpdateResult = await storeCategory({ sqlClient, ...testCategory3 });
    leftSide.testCategory3UpdateResult = {
        success: false,
        message: "Unable to insert category with slug test-category-three, update values {\"name\":\"Test Category Three\",\"parentSlug\":\"parent-test-category\",\"description\":\"A Category 3 for Testing\",\"username\":\"tester\",\"slug\":\"test-category-three\"}"
    }
    rightSide.testCategory3UpdateResult = testCategory3UpdateResult;
    const removeThreeResult = await removeCategory({ sqlClient, slug: 'test-category-three' });
    leftSide.removeThreeResult = {
        success: true,
        slug: 'test-category-three'
    }
    rightSide.removeThreeResult = removeThreeResult;


    const testCategory22 = { slug: 'test-category2', parentSlug: 'parent-test-category', name: 'Test Category Two - Updated', description: 'A Category 2 for Testing' }
    const testCategory22Result = await storeCategory({ sqlClient, ...testCategory22 });
    leftSide.testCategory22Result = {
        success: true,
        slug: 'test-category2'
    }
    rightSide.testCategory22Result = testCategory22Result;


    const fetch2Result = await fetchCategory({ sqlClient, slug: 'test-category2' });
    leftSide.fetch2Result = {
        success: true,
        category: {
            createdBy: "tester",
            description: "A Category 2 for Testing",
            name: "Test Category Two - Updated",
            parentSlug: "parent-test-category",
            slug: "test-category2",
            updatedBy: "tester"
        },
    }
    delete fetch2Result.category.micros;
    delete fetch2Result.category.updated;
    delete fetch2Result.category.created;
    rightSide.fetch2Result = fetch2Result;


    const fetchChildrenResult = await fetchCategoryChildren({ sqlClient, slug: 'parent-test-category' });
    leftSide.fetchChildrenResult = {
        success: true,
        categories: [
            {
                createdBy: "tester",
                description: "A Category 1 for Testing",
                name: "Test Category One",
                parentSlug: "parent-test-category",
                slug: "test-category1"
            },
            {
                createdBy: "tester",
                description: "A Category 2 for Testing",
                name: "Test Category Two - Updated",
                parentSlug: "parent-test-category",
                slug: "test-category2",
                updatedBy: "tester"
            }
        ]
    }
    delete fetchChildrenResult.categories[0].created
    delete fetchChildrenResult.categories[1].created
    delete fetchChildrenResult.categories[0].micros
    delete fetchChildrenResult.categories[1].micros
    delete fetchChildrenResult.categories[0].updated
    delete fetchChildrenResult.categories[1].updated
    delete fetchChildrenResult.categories[0].updatedBy
    rightSide.fetchChildrenResult = fetchChildrenResult;

    await endTest(sqlClient);

    l('after endTest')
    await sleep(3000)
    expect(rightSide).toEqual(leftSide);


})

test('testing products', async () => {
    allowLog();

    //console.log = jest.fn()
    //expect(console.log).toHaveBeenCalled();
    //  const { output, expected } = await testCommentsFetchPage0();
    // console.log("post test")

    let leftSide = {};
    let rightSide = {};
    const sqlClient = await initTest();
    const testUser = {
        slug: 'tester-fester',
        role: 'ops'
    };

    const testUserResult1 = await storeUser({ sqlClient, ...testUser })
    leftSide.testUserResult1 = {
        success: true,
        slug: 'tester-fester',
    }
    rightSide.testUserResult1 = testUserResult1;
    const fetchUser2Result = await fetchUser({ sqlClient, slug: 'tester-fester' });
    leftSide.fetchUser2Result = {
        success: true,
        user: {
            slug: "tester-fester",
            role: "ops",
            createdBy: 'tester'
        },
    }
    delete fetchUser2Result.user.micros;
    delete fetchUser2Result.user.updated;
    delete fetchUser2Result.user.updatedBy;
    delete fetchUser2Result.user.created;
    rightSide.fetchUser2Result = fetchUser2Result;



    const testBrand = {
        name: 'Test Brand',
        description: 'A Brand for Testing',
        image: 'test brand image',
        imageSrc: 'test brand image source',
        url: 'url-of-test-brand',
    }
    const testBrandResult1 = await storeBrand({ sqlClient, ...testBrand })
    leftSide.testBrandResult1 = {
        success: true,
        slug: 'test-brand'
    }
    rightSide.testBrandResult1 = testBrandResult1;

    const testPublication = {
        name: 'Test Publication',
        description: 'A Publication for Testing',
        image: 'test publication image',
        imageSrc: 'test publication image source',
        url: 'url-of-test-publication',
        active: 1,
        handler: 'testHandler'
    }
    const testPublicationResult1 = await storePublication({ sqlClient, ...testPublication })
    leftSide.testPublicationResult1 = {
        success: true,
        slug: 'test-publication'
    }
    rightSide.testPublicationResult1 = testPublicationResult1;



    const testProduct1 = {
        name: 'Test Product 1',
        description: "A product for testing one",
        sentiment: {
            index: "4567",
            ranking: "34/56"
        },
        sentimentScore: 4567,
        image: "test image",
        imageSrc: "test image source",
        itemUrl: "test item url",
        manufUrl: "test manuf url",
        categorySlug: 'test-category1',
        brandSlug: 'test-brand'

    }
    const testProductResult1 = await storeProduct({ sqlClient, ...testProduct1 })
    leftSide.testProductResult1 = {
        success: true,
        slug: 'test-product-1'
    }
    rightSide.testProductResult1 = testProductResult1;


    const testProduct2 = {
        name: 'Test Product 2',
        description: "A product for testing two",
        sentiment: {
            index: "3456",
            ranking: "23/45"
        },
        sentimentScore: 3456,
        image: "test image 2",
        imageSrc: "test image source 2",
        itemUrl: "test item url 2",
        manufUrl: "test manuf url 2",
        categorySlug: 'test-category1',
        brandSlug: 'test-brand'
    }


    const testProductResult2 = await storeProduct({ sqlClient, ...testProduct2 })
    leftSide.testProductResult2 = {
        success: true,
        slug: 'test-product-2'
    }
    rightSide.testProductResult2 = testProductResult2;


    const replaceCategoryResult = await replaceProductCategory({ sqlClient, categorySlug: 'test-category2', oldCategorySlug: 'test-category1' });
    leftSide.replaceCategoryResult = {
        success: true,
        slug: 'test-category2'
    }
    rightSide.replaceCategoryResult = replaceCategoryResult;



    const fetchProductCategoryResult1 = await fetchProductsByCategory({ sqlClient, categorySlug: 'test-category1' });
    leftSide.fetchProductCategoryResult1 = {
        success: false,
        message: "No children exist for the slug test-category1"
    }
    rightSide.fetchProductCategoryResult1 = fetchProductCategoryResult1;
    const fetchProductCategoryResult2 = await fetchProductsByCategory({ sqlClient, categorySlug: 'test-category2' });
    leftSide.fetchProductCategoryResult2 = {
        success: true,
        products: [
            {
                categorySlug: "test-category2",
                createdBy: "tester",
                description: "A product for testing one",
                image: "test image",
                imageSrc: "test image source",
                itemUrl: "test item url",
                manufUrl: "test manuf url",
                name: "Test Product 1",
                sentiment: "{\"index\":\"4567\",\"ranking\":\"34/56\"}",
                sentimentScore: 4567,
                slug: "test-product-1",
                cdn: 0,
                brandSlug: 'test-brand'
            },
            {
                categorySlug: "test-category2",
                createdBy: "tester",
                description: "A product for testing two",
                image: "test image 2",
                imageSrc: "test image source 2",
                itemUrl: "test item url 2",
                manufUrl: "test manuf url 2",
                name: "Test Product 2",
                sentiment: "{\"index\":\"3456\",\"ranking\":\"23/45\"}",
                sentimentScore: 3456,
                slug: "test-product-2",
                cdn: 0,
                brandSlug: 'test-brand'
            }
        ]
    }
    delete fetchProductCategoryResult2.products[0].updated;
    delete fetchProductCategoryResult2.products[1].updated;
    delete fetchProductCategoryResult2.products[0].updatedBy;
    delete fetchProductCategoryResult2.products[1].updatedBy;
    delete fetchProductCategoryResult2.products[0].created;
    delete fetchProductCategoryResult2.products[1].created;
    delete fetchProductCategoryResult2.products[0].micros;
    delete fetchProductCategoryResult2.products[1].micros;
    rightSide.fetchProductCategoryResult2 = fetchProductCategoryResult2;


    const updateSentimentResult = await updateProductSentiment({
        sqlClient, slug: 'test-product-1', sentiment: {
            index: "1111",
            ranking: "1/234"
        }, sentimentScore: 1111
    });
    leftSide.updateSentimentResult = {
        success: true,
        slug: 'test-product-1'
    }
    rightSide.updateSentimentResult = updateSentimentResult;

    const fetch2Result = await fetchProduct({ sqlClient, slug: 'test-product-1' });
    leftSide.fetch2Result = {
        success: true,
        product: {
            createdBy: "tester",
            description: "A product for testing one",
            name: "Test Product 1",
            categorySlug: "test-category2",
            slug: "test-product-1",
            updatedBy: "tester",
            image: "test image",
            imageSrc: "test image source",
            itemUrl: "test item url",
            manufUrl: "test manuf url",
            sentiment: "{\"index\":\"1111\",\"ranking\":\"1/234\"}",
            sentimentScore: 1111,
            cdn: 0,
            brandSlug: 'test-brand'
        },
    }
    delete fetch2Result.product.micros;
    delete fetch2Result.product.updated;
    delete fetch2Result.product.created;
    rightSide.fetch2Result = fetch2Result;


    const testReview1 = {
        title: 'Test review 1',
        description: "A review for testing one",
        sentiment: {
            index: "4567",
            ranking: "34/56"
        },
        sentimentScore: 4567,

        url: "test review url",
        author: "test author",
        publicationSlug: 'test-publication',
        productSlug: 'test-product-1',
        published: 1

    }
    const testReviewResult1 = await storeReview({ sqlClient, ...testReview1 })
    leftSide.testReviewResult1 = {
        success: true,
        slug: 'test-review-1'
    }
    rightSide.testReviewResult1 = testReviewResult1;


    const fetchReviewsResult = await fetchReviews({ sqlClient, productSlug: 'test-product-1' });
    leftSide.fetchReviewsResult = {
        success: true,
        reviews: [{
            createdBy: "tester",
            description: "A review for testing one",
            title: "Test review 1",
            productSlug: "test-product-1",
            slug: "test-review-1",
            createdBy: "tester",

            url: "test review url",
            author: "test author",
            sentiment: "{\"index\":\"4567\",\"ranking\":\"34/56\"}",
            sentimentScore: 4567,
            publicationSlug: 'test-publication',
            published: 1
        }],
    }
    delete fetchReviewsResult.reviews[0].micros;
    delete fetchReviewsResult.reviews[0].updated;
    delete fetchReviewsResult.reviews[0].updatedBy;
    delete fetchReviewsResult.reviews[0].created;
    rightSide.fetchReviewsResult = fetchReviewsResult;
    await endTest(sqlClient);

    l('after endTest')
    await sleep(1000)
    expect(rightSide).toEqual(leftSide);


})

