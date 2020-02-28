// ./src/sync.js


const { chalk, l, microtime } = require('./common');
const { updateMetatag, updateTag, updateReview } = require('./db');


async function process({ item }) {
    let jsonItem = JSON.parse(item);
    switch (jsonItem.type) {
        case 'matatag':
            await uppdateMetatag(jsonItem.metatag);
            break;
        case 'tag':
            await updateTag(jsonItem.tag);
            break;
        case 'review':
            await updateReview(jsonItem.review);
            break;
    }

}