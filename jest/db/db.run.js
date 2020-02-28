const { initTest, endTest, createCategory } = require('./db.helper');



const sqlClient = initTest();
const testCategory1 = { slug: 'test-category', parentSlug: 'parent-test-category', name: 'Test Category', description: 'A Category for Testing' }
const res1 = createCategory({ sqlClient, ...testCategory1 });
console.log('createCategory', testCategory1, res1);
