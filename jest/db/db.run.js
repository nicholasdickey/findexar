const { initTest, endTest, storeCategory, fetchCategoryChildren, removeCategory, fetchCategory,
    storeProduct, replaceProductCategory, updateProductSentiment, fetchProduct, fetchProductsByCategory } = require('./db.helper');
const { l, allowLog } = require('../../src/api/common')
//console.log("ENV:", process.env)

async function test() {
    allowLog();
    const sqlClient = await initTest();
    // console.log("sqlClient", sqlClient)
    /*  const parentCategory = { slug: 'parent-test-category', parentSlug: '', name: 'Top Parent Test Category', description: 'A Root Category for Testing' }
      const parentCategoryResult = await storeCategory({ sqlClient, ...parentCategory });
      const testCategory1 = { slug: 'test-category1', parentSlug: 'parent-test-category', name: 'Test Category One', description: 'A Category 1 for Testing' }
      const testCategory1Result = await storeCategory({ sqlClient, ...testCategory1 });
      const testCategory2 = { slug: 'test-category2', parentSlug: 'parent-test-category', name: 'Test Category Two', description: 'A Category 2 for Testing' }
      const testCategory2Result = await storeCategory({ sqlClient, ...testCategory2 });
      const testCategory3 = { parentSlug: 'parent-test-category', name: 'Test Category Three', description: 'A Category 3 for Testing' }
      const testCategory3Result = await storeCategory({ sqlClient, ...testCategory3 });
  
      const removeParentResult = await removeCategory({ sqlClient, slug: 'parent-test-category' });
      const removeThreeResult = await removeCategory({ sqlClient, slug: 'test-category-three' });
  
      const testCategory22 = { slug: 'test-category2', parentSlug: 'parent-test-category', name: 'Test Category Two - Updated', description: 'A Category 2 for Testing' }
      const testCategory22Result = await storeCategory({ sqlClient, ...testCategory22 });
  
      const fetch2Result = await fetchCategory({ sqlClient, slug: 'test-category2' });
      const fetchChildrenResult = await fetchCategoryChildren({ sqlClient, slug: 'parent-test-category' });
      */
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
        manufUrl: "test manud url",
        categorySlug: 'test-category1'
    }
    const testProduct1Result = await storeProduct({ sqlClient, ...testProduct1 })
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
        manufUrl: "test manud url 2",
        categorySlug: 'test-category1'
    }
    const testProduct1Result2 = await storeProduct({ sqlClient, ...testProduct2 })
    const replaceCategoryResult = await replaceProductCategory({ sqlClient, categorySlug: 'test-category2', oldCategorySlug: 'test-category1' });
    const fetchProductCategoryResult1 = await fetchProductsByCategory({ sqlClient, categorySlug: 'test-category1' });
    const fetchProductCategoryResult2 = await fetchProductsByCategory({ sqlClient, categorySlug: 'test-category2' });
    const updateSentimentResult = await updateProductSentiment({
        sqlClient, slug: 'test-product-1', sentiment: {
            index: "1111",
            ranking: "1/234"
        }
    });


    await endTest(sqlClient);
    /*l('storeCategory', JSON.stringify({
        parentCategory,
        parentCategoryResult,
        testCategory1,
        testCategory1Result,
        testCategory2,
        testCategory2Result,
        testCategory3,
        testCategory3Result,
        removeParentResult,
        removeThreeResult,
        testCategory22,
        testCategory22Result,
        fetch2Result,
        fetchChildrenResult

    }, null, 4)); */

}
test();
