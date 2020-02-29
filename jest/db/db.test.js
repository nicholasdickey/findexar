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
    fetchProductsByCategory
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
        success: true
    }
    rightSide.parentCategoryResult = parentCategoryResult;
    const testCategory1 = { slug: 'test-category1', parentSlug: 'parent-test-category', name: 'Test Category One', description: 'A Category 1 for Testing' }
    const testCategory1Result = await storeCategory({ sqlClient, ...testCategory1 });
    leftSide.testCategory1Result = {
        success: true
    }
    rightSide.testCategory1Result = testCategory1Result;

    const testCategory2 = { slug: 'test-category2', parentSlug: 'parent-test-category', name: 'Test Category Two', description: 'A Category 2 for Testing' }
    const testCategory2Result = await storeCategory({ sqlClient, ...testCategory2 });
    leftSide.testCategory2Result = {
        success: true
    }
    rightSide.testCategory2Result = testCategory2Result;



    const testCategory3 = { parentSlug: 'parent-test-category', name: 'Test Category Three', description: 'A Category 3 for Testing' }
    const testCategory3Result = await storeCategory({ sqlClient, ...testCategory3 });
    leftSide.testCategory3Result = {
        success: true
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
        success: true
    }
    rightSide.removeThreeResult = removeThreeResult;


    const testCategory22 = { slug: 'test-category2', parentSlug: 'parent-test-category', name: 'Test Category Two - Updated', description: 'A Category 2 for Testing' }
    const testCategory22Result = await storeCategory({ sqlClient, ...testCategory22 });
    leftSide.testCategory22Result = {
        success: true
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
    //allowLog();

    //console.log = jest.fn()
    //expect(console.log).toHaveBeenCalled();
    //  const { output, expected } = await testCommentsFetchPage0();
    // console.log("post test")

    let leftSide = {};
    let rightSide = {};
    const sqlClient = await initTest();

    const testProduct1 = {
        name: 'Test Product 1',
        description: "A product for testing one",
        sentiment: {
            index: "4567",
            ranking: "34/56"
        },
        image: "test image",
        imageSrc: "test image source",
        itemUrl: "test item url",
        manufUrl: "test manuf url",
        categorySlug: 'test-category1'
    }
    const testProductResult1 = await storeProduct({ sqlClient, ...testProduct1 })
    leftSide.testProductResult1 = {
        success: true
    }
    rightSide.testProductResult1 = testProductResult1;


    const testProduct2 = {
        name: 'Test Product 2',
        description: "A product for testing two",
        sentiment: {
            index: "3456",
            ranking: "23/45"
        },
        image: "test image 2",
        imageSrc: "test image source 2",
        itemUrl: "test item url 2",
        manufUrl: "test manuf url 2",
        categorySlug: 'test-category1'
    }


    const testProductResult2 = await storeProduct({ sqlClient, ...testProduct2 })
    leftSide.testProductResult2 = {
        success: true
    }
    rightSide.testProductResult2 = testProductResult2;


    const replaceCategoryResult = await replaceProductCategory({ sqlClient, categorySlug: 'test-category2', oldCategorySlug: 'test-category1' });
    leftSide.replaceCategoryResult = {
        success: true
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
                slug: "test-product-1",
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
                slug: "test-product-2",
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
        }
    });
    leftSide.updateSentimentResult = {
        success: true
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
        },
    }
    delete fetch2Result.product.micros;
    delete fetch2Result.product.updated;
    delete fetch2Result.product.created;
    rightSide.fetch2Result = fetch2Result;



    await endTest(sqlClient);

    l('after endTest')
    await sleep(3000)
    expect(rightSide).toEqual(leftSide);


})

