const { l, allowLog, sleep, chalk } = require('../../src/api/common')
const { initTest, endTest, qlQuery, qlMutate } = require('./ql.helper')

test('testing submitPublication', async () => {
    allowLog();

    //console.log = jest.fn()
    //expect(console.log).toHaveBeenCalled();
    //  const { output, expected } = await testCommentsFetchPage0();
    // console.log("post test")

    let leftSide = {};
    let rightSide = {};
    const sqlClient = await initTest();

    const submitPublication = {
        mutation: `submitPublication`,
        variables: {
            publication: {
                slug: 'test-amazon',
                name: 'Test Amazon Publication'
            }
        }
    }
    const submitPublicationResult = await qlMutate(submitPublication);
    leftSide.submitPublicationResult = {
        data: {
            submitPublication: {
                slug: "test-amazon"
            }
        }
    }
    rightSide.submitPublicationResult = submitPublicationResult;


    await endTest(sqlClient);

    l('after endTest')
    await sleep(3000)
    expect(rightSide).toEqual(leftSide);


})