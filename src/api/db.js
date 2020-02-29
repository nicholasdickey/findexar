var mysql = require('mysql');
const util = require('util');
const slugify = require('slugify');
const { l, chalk, microtime } = require('./common');

const dbServer = process.env.DB_SERVER;
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const dbDatabase = process.env.DB_DATABASE;

/*var connection = mysql.createConnection({
    host: dbServer,
    user: dbUser,
    password: dbPassword,
    database: dbDatabase
});*/
//const query = util.promisify(connection.query).bind(connection);
const dbStart = async () => {
    var connection = mysql.createConnection({
        host: dbServer,
        user: dbUser,
        password: dbPassword,
        database: dbDatabase
    });
    const query = util.promisify(connection.query).bind(connection);
    await connection.connect();
    return { connection, query };
}
const dbEnd = async ({ connection }) => {
    l("DISCONNECT");
    await connection.end();
}
const ds = (s => s || "")
const dbLog = async ({ query, type, body, threadid, sessionid, username }) => {
    let sql = "SELECT enabled,username from dblog_config limit 1";
    let rows = await query(sql);
    let enabled = rows ? rows[0]['enabled'] : 0;
    let enabledUsername = rows ? rows[0]['username'] : '';
    username = ds(username);
    if (enabled == 1 && (!enabledUsername || enabledUsername == username)) {
        sql = `INSERT into dblog (type,threadid,body,micros,sessionid,username) VALUES (?,?,?,?,?,?)`;
        await query(sql, [type, threadid, body, microtime(), sessionid, username])
        l(chalk.red("DBLOG:", type, body))

    }
}
const dbCategory = async ({ query, sessionid, threadid, category, username, action }) => {
    let { slug, parentSlug, name, description, micros } = category;
    name = ds(name);
    description = ds(description);
    micros = micros || microtime();

    let sql = '';
    let result = false;
    let res = false;
    switch (action) {
        case 'remove':
            //Check if has children
            sql = `SELECT slug from categories where parentSLug='${slug}'`;
            rows = await query(`SELECT slug from categories where parentSlug=?`, [slug]);
            await dbLog({ query, type: 'SQL', body: `{sql:${sql}, res:${rows ? JSON.stringify(rows, null, 4) : 'null'}}`, threadid, sessionid, username });
            if (rows && rows.length)
                result = {
                    success: false,
                    message: 'Unable to delete category: still has children'
                }
            else {
                sql = `DELETE from categories where slug='${slug}'`;
                let res = await query(`DELETE from categories where slug=?`, [slug]);
                await dbLog({ query, type: 'SQL', body: `{sql:${sql}, res:${res ? JSON.stringify(res, null, 4) : 'null'}}`, threadid, sessionid, username });
                if (res) {
                    result = {
                        success: true
                    }
                }
                else {
                    result = {
                        success: false,
                        message: res.message
                    }
                }
            }
            break;
        case 'fetch': {
            sql = `SELECT * from categories where slug='${slug}'`;
            let rows = await query(`SELECT * from categories where slug=?`, [slug]);
            await dbLog({ query, type: 'SQL', body: `{sql:${sql}, res:${rows ? JSON.stringify(rows, null, 4) : 'null'}}`, threadid, sessionid, username });
            if (rows && rows.length) {
                result = {
                    success: true,
                    category: rows[0]
                }
            }
            else {
                result = {
                    success: false,
                    message: `No categories matched the slug ${slug}`
                }
            }
            break;
        }
        case 'fetchChildren': {
            sql = `SELECT * from categories where parentSlug='${slug}'`;
            let rows = await query(`SELECT * from categories where parentSlug=?`, [slug]);
            await dbLog({ query, type: 'SQL', body: `{sql:${sql}, res:${rows ? JSON.stringify(rows, null, 4) : 'null'}}`, threadid, sessionid, username });
            if (rows && rows.length) {
                result = {
                    success: true,
                    categories: rows
                }
            }
            else {
                result = {
                    success: false,
                    message: `No children exist for the slug ${slug}`
                }
            }
            break;
        }
        default: //update,insert
            if (!slug) {
                action = 'insert';
                let slugVerified = false;
                let t = name;
                if (!t)
                    t = description;
                let i = 0;
                let text = t;

                while (!slugVerified) {
                    slug = slugify(t, { lower: true });
                    sql = `SELECT * from categories where slug='${slug}'`;
                    let res = await query(`SELECT * from categories where slug=?`, [slug]);
                    await dbLog({ query, type: 'slugify', body: JSON.stringify({ slug, sql, res }), threadid, sessionid, username });

                    if (!result) {
                        slugVerified = true;
                    }
                    else {
                        t = text + `-${i++}`;
                    }
                    if (i > 100) {
                        return false;
                    }
                }
            }
            if (action != 'insert') {
                sql = `SELECT * from categories where slug='${slug}'`;
                let rows = await query(`SELECT * from categories where slug=?`, [slug]);
                let res = false;
                if (rows)
                    res = rows[0];
                await dbLog({ query, type: 'SQL', body: `{sql:${sql}, res:${rows ? JSON.stringify(rows, null, 4) : 'null'}}`, threadid, sessionid, username });
                if (res) {
                    if (res.micros < micros) {
                        sql = `UPDATE categories set name='${name}', description='${description}',parentSlug='${parentSlug}, micros=${micros},updatedBy=${username}, updated=now() where slug='${slug}`;
                        res = await query(`UPDATE  categories set name=?,description=?,parentSlug=?,micros=?,updatedBy=?,updated=now()  where slug=?`, [name, description, parentSlug, micros, username, slug]);
                        await dbLog({ query, type: 'SQL', body: `{sql:${sql}, res:${res ? JSON.stringify(res, null, 4) : 'null'}}`, threadid, sessionid, username });
                        if (res && res.affectedRows) {
                            result = {
                                success: true
                            }
                        }
                        else {
                            let cap = JSON.stringify(
                                {
                                    name,
                                    description,
                                    username,
                                    slug
                                }
                            )
                            result = {
                                success: false,
                                message: `Unable to update category with slug ${slug}, update values ${cap}`
                            }
                        }
                    }
                }
                else action = 'insert';
            }
            if (action == 'insert') {
                sql = `INSERT into categories (name,description,micros,slug,parentSlug,createdBy) VALUES ('${name}','${description}',${micros},'${slug}','${parentSlug}','${username}')`
                let res = false;
                try {
                    res = await query(`INSERT into categories (name,description,micros,slug,parentSlug,createdBy) VALUES (?,?,?,?,?,?)`, [name, description, micros, slug, parentSlug, username]);
                }
                catch (x) {
                    l("HANDLED DB EXCEPTION:", x)
                }
                await dbLog({ query, type: 'SQL', body: `{sql:${sql}, res:${res ? JSON.stringify(res, null, 4) : 'null'}}`, threadid, sessionid, username });
                if (res && res.affectedRows) {
                    result = {
                        success: true
                    }
                }
                else {
                    let cap = JSON.stringify({ name, parentSlug, description, username, slug });
                    result = {
                        success: false,
                        message: `Unable to insert category with slug ${slug}, update values ${cap}`
                    }
                }
            }
    }

    l("retrning from db.js:", result)
    return result;
}
const dbProduct = async ({ query, sessionid, threadid, product, username, action }) => {
    let { slug, categorySlug, oldCategorySlug, name, description, image, imageSrc, sentiment, itemUrl, manufUrl, micros } = product;
    name = ds(name);
    categorySlug = ds(categorySlug) || 'unknown';
    description = ds(description);
    image = ds(image);
    imageSrc = ds(imageSrc);
    sentiment = JSON.stringify(sentiment || {});
    itemUrl = ds(itemUrl);
    manufUrl = ds(manufUrl);
    micros = micros || microtime();

    let sql = '';
    let result = false;
    let res = false;
    switch (action) {
        /*  case 'remove':
              //Check if has children
              sql = `SELECT slug from categories where parentSLug='${slug}'`;
              rows = await query(`SELECT slug from categories where parentSlug=?`, [slug]);
              await dbLog({ query, type: 'SQL', body: `{sql:${sql}, res:${rows ? JSON.stringify(rows, null, 4) : 'null'}}`, threadid, sessionid, username });
              if (rows && rows.length)
                  result = {
                      success: false,
                      message: 'Unable to delete category: still has children'
                  }
              else {
                  sql = `DELETE from categories where slug='${slug}'`;
                  let res = await query(`DELETE from categories where slug=?`, [slug]);
                  await dbLog({ query, type: 'SQL', body: `{sql:${sql}, res:${res ? JSON.stringify(res, null, 4) : 'null'}}`, threadid, sessionid, username });
                  if (res) {
                      result = {
                          success: true
                      }
                  }
                  else {
                      result = {
                          success: false,
                          message: res.message
                      }
                  }
              }
              break;*/
        case 'fetch': {
            sql = `SELECT * from products where slug='${slug}'`;
            let rows = await query(`SELECT * from products where slug=?`, [slug]);
            await dbLog({ query, type: 'SQL', body: `{sql:${sql}, res:${rows ? JSON.stringify(rows, null, 4) : 'null'}}`, threadid, sessionid, username });
            if (rows && rows.length) {
                result = {
                    success: true,
                    product: rows[0]
                }
            }
            else {
                result = {
                    success: false,
                    message: `No products matched the slug ${slug}`
                }
            }
            break;
        }
        case 'fetchByCategory': {
            sql = `SELECT * from products where categorySlug='${categorySlug}'`;
            let rows = await query(`SELECT * from products where categorySlug=?`, [categorySlug]);
            await dbLog({ query, type: 'SQL', body: `{sql:${sql}, res:${rows ? JSON.stringify(rows, null, 4) : 'null'}}`, threadid, sessionid, username });
            if (rows && rows.length) {
                result = {
                    success: true,
                    products: rows
                }
            }
            else {
                result = {
                    success: false,
                    message: `No children exist for the slug ${categorySlug}`
                }
            }
            break;
        }
        case 'replaceCategory': {
            sql = `UPDATE products set categorySlug='${categorySlug}',updated=now(),updatedBy='${username}' where categorySlug='${oldCategorySlug}'`;
            let res = await query(`UPDATE products set categorySlug=?,updated=now(),updatedBy=? where categorySlug=?`, [categorySlug, username, oldCategorySlug]);
            await dbLog({ query, type: 'SQL', body: `{sql:${sql}, res:${res ? JSON.stringify(res, null, 4) : 'null'}}`, threadid, sessionid, username });
            if (res) {
                result = {
                    success: true
                }
            }
            else {
                result = {
                    success: false,
                    message: `Unable to change the product category from ${oldCategorySlug} to ${categorySlug}`
                }
            }
            break;
        }
        case 'updateSentiment': {
            sql = `UPDATE products set sentiment='${sentiment}',updated=now(),updatedBy='${username}' where slug='${slug}'`;
            let res = await query(`UPDATE products set sentiment=?,updated=now(),updatedBy=? where slug=?`, [sentiment, username, slug]);
            await dbLog({ query, type: 'SQL', body: `{sql:${sql}, res:${res ? JSON.stringify(res, null, 4) : 'null'}}`, threadid, sessionid, username });
            if (res) {
                result = {
                    success: true
                }
            }
            else {
                result = {
                    success: false,
                    message: `Unable to update the product sentiment ${sentiment} for ${slug}`
                }
            }
            break;
        }
        default: //update,insert
            if (!slug) {
                action = 'insert';
                let slugVerified = false;
                let t = name;
                if (!t)
                    t = description;
                let i = 0;
                let text = t;

                while (!slugVerified) {
                    slug = slugify(t, { lower: true });
                    sql = `SELECT * from products where slug='${slug}'`;
                    let res = await query(`SELECT * from products where slug=?`, [slug]);
                    await dbLog({ query, type: 'slugify', body: JSON.stringify({ slug, sql, res }), threadid, sessionid, username });

                    if (!result) {
                        slugVerified = true;
                    }
                    else {
                        t = text + `-${i++}`;
                    }
                    if (i > 100) {
                        return false;
                    }
                }
            }
            if (action != 'insert') {
                sql = `SELECT * from products where slug='${slug}'`;
                let rows = await query(`SELECT * from products where slug=?`, [slug]);
                let res = false;
                if (rows)
                    res = rows[0];
                await dbLog({ query, type: 'SQL', body: `{sql:${sql}, res:${rows ? JSON.stringify(rows, null, 4) : 'null'}}`, threadid, sessionid, username });
                if (res) {
                    if (res.micros < micros) {
                        sql = `UPDATE products set name='${name}', description='${description}',categorySlug='${parentSlug},image='${image}',imageSrc='${imageSrc}',sentiment='${sentiment}',itemUrl='${itemUrl}',manufUrl='${manufUrl}', micros=${micros},updatedBy=${username}, updated=now() where slug='${slug}`;
                        res = await query(`UPDATE  products set name=?,description=?,categorySlug=?,image=?,imageSrc=?,sentiment=?,itemUrl=?,manufUrl=?,micros=?,updatedBy=?,updated=now()  where slug=?`, [name, description, parentSlug, image, imageSrc, sentiment, itemUrl, manufUrl, micros, username, slug]);
                        await dbLog({ query, type: 'SQL', body: `{sql:${sql}, res:${res ? JSON.stringify(res, null, 4) : 'null'}}`, threadid, sessionid, username });
                        if (res && res.affectedRows) {
                            result = {
                                success: true
                            }
                        }
                        else {
                            let cap = JSON.stringify(
                                {
                                    name,
                                    description,
                                    micros,
                                    username,
                                    slug
                                }
                            )
                            result = {
                                success: false,
                                message: `Unable to update product with slug ${slug}, update values ${cap}`
                            }
                        }
                    }
                }
                else action = 'insert';
            }
            if (action == 'insert') {
                sql = `INSERT into products (name,description,imageSrc,image,sentiment,itemUrl,manufUrl,micros,slug,categorySlug,createdBy) VALUES ('${name}','${description}','${imageSrc}','${image}','${sentiment}','${itemUrl}','${manufUrl}',${micros},'${slug}','${categorySlug}','${username}')`
                let res = false;
                try {
                    res = await query(`INSERT into products (name,description,imageSrc,image,sentiment,itemUrl,manufUrl,micros,slug,categorySlug,createdBy) VALUES (?,?,?,?,?,?,?,?,?,?,?)`, [name, description, imageSrc, image, sentiment, itemUrl, manufUrl, micros, slug, categorySlug, username]);
                }
                catch (x) {
                    l("HANDLED DB EXCEPTION:", x)
                }
                await dbLog({ query, type: 'SQL', body: `{sql:${sql}, res:${res ? JSON.stringify(res, null, 4) : 'null'}}`, threadid, sessionid, username });
                if (res && res.affectedRows) {
                    result = {
                        success: true
                    }
                }
                else {
                    let cap = JSON.stringify({ name, categorySlug, description, imageSrc, image, sentiment, itemUrl, manufUrl, micros, username, slug });
                    result = {
                        success: false,
                        message: `Unable to insert product with slug ${slug}, update values ${cap}`
                    }
                }
            }
    }

    l("retrning from db.js:", result)
    return result;
}


/*
const dbMetatag = ({ query, sessionid, threadid, metatag, action }) => {
    let ownConnect = false;
    if (!query) {
        ownConnect = true;
        query = dbStart();
    }
    let remove = action == 'remove';
    let { type, tag, path, name, description, image_src, image, micros } = metatag;
    type = ds(type);
    tag = ds(tag);
    path = ds(path);
    name = ds(name);
    description = ds(description);
    image_src = ds(image_src);
    image = ds(image);
    micros = micros || 0;
    let sql = '';
    let result = false;

    if (remove) {
        sql = `DELETE from metatags where tag='${tag}'`;
        result = await query(`DELETE from metatags where tag=?`, [tag]);
        dbLog({ query, type: 'SQL', body: `{sql:${sql}, res:${result ? JSON.stringify(result, null, 4) : 'null'}}`, threadid, sessionid });
        if (ownConnect)
            dbEnd();
        return result;
    }
    sql = `SELECT * from metatags where tag='${tag}'`;
    let rows = await query(`SELECT * from metatags where tag=?`, [tag]);
    let exist = rows[0];
    dbLog({ query, type: 'SQL', body: `{sql:${sql}, res:${exist ? JSON.stringify(exist, null, 4) : 'null'}}`, threadid, sessionid });
    if (exist && exist.micros < micros) {
        sql = `UPDATE metatags set type='${type}',path='${path}', name='${name}', description='${description}', image_src='${image_src}', image='${image}', micros=${micros} where tag='${tag}'`
        result = await query(`UPDATE metatags set type=?, path=?, name=?,description=?,image_src=?,image=?,micros=?  where tag=?`, [type, path, name, description, image_src, image, micros, tag]);
        dbLog({ query, type: 'SQL', body: `{sql:${sql}, res:${result ? JSON.stringify(result, null, 4) : 'null'}}`, threadid, sessionid })
    }
    else if (!exist) {
        sql = `INSERT INTO metatags (type,tag,path,name,description,image_src,image,micros) VALUES('${type}','${tag}','${path}','${name}','${description}','${image_src}','${image}',${micros})`;
        result = await query(`INSERT INTO metatags(type,tag,path,name,description,image_src,image,micros) VALUES (?,?,?,?,?,?,?,?)`, [type, tag, path, name, description, image_src, image, micros])
        dbLog({ query, type: 'SQL', body: `{sql:${sql}, res:${result ? JSON.stringify(result, null, 4) : 'null'}}`, threadid, sessionid })
    }
    if (ownConnect)
        dbEnd();
    return result;
}
const dbTag = ({ query, sessionid, threadid, tag: tagdef, action }) => {
    let remove = action == 'remove';
    let ownConnect = false;
    if (!query) {
        ownConnect = true;
        query = dbStart();
    }
    let { review, tag, micros } = tagdef;
    tag = ds(tag);
    review = ds(review);
    micros = micros || 0;
    let sql = '';
    let result = false;

    if (remove) {
        sql = `DELETE from tags where tag='${tag}' and review='${review}'`;
        result = await query(`DELETE from tags where tag=? and review=?`, [tag, review]);
        dbLog({ query, type: 'SQL', body: `{sql:${sql}, res:${result ? JSON.stringify(result, null, 4) : 'null'}}`, threadid, sessionid });
        if (ownConnect)
            dbEnd();
        return result
    }
    sql = `SELECT * from tags where tag='${tag}'`;
    let rows = await query(`SELECT * from tags where tag=?`, [tag]);
    let exist = rows[0];
    result = false;
    dbLog({ query, type: 'SQL', body: `{sql:${sql}, res:${exist ? JSON.stringify(exist, null, 4) : 'null'}}`, threadid, sessionid });
    if (!exist) {
        sql = `INSERT INTO tags (tag,review,micros) VALUES('${tag}','${review}',${micros})`;
        result = await query(`INSERT INTO tags(tag,pathmicros) VALUES (?,?,?,?,?,?)`, [tag, review, micros])
        dbLog({ query, type: 'SQL', body: `{sql:${sql}, res:${result ? JSON.stringify(result, null, 4) : 'null'}}`, threadid, sessionid })
    }
    if (ownConnect)
        dbEnd();
    return result;

}
const dbReview = ({ query, sessionid, threadid, review, action }) => {
    let ownConnect = false;
    if (!query) {
        ownConnect = true;
        query = dbStart();
    }
    let { title, description, sentiment, url, author, published, micros, slug }
    title = ds(title);
    description = ds(description);
    sentiment = ds(sentiment);
    url = ds(url);
    author = ds(author);
    slug = ds(slug);
    published = published || 0;
    micros = micros || 0;
    let sql = '';
    let result = false;

    switch (action) {
        case 'remove':
            sql = `DELETE from reviews where slug='${slug}'`;
            result = await query(`DELETE from reviews where slug=?`, [slug]);
            dbLog({ query, type: 'SQL', body: `{sql:${sql}, res:${result ? JSON.stringify(result, null, 4) : 'null'}}`, threadid, sessionid });
            break;
        case 'fetch':
            sql = `SELECT * from reviews where slug='${slug}'`;
            let rows = await query(`SELECT * from reviews where slug=?`, [slug]);
            dbLog({ query, type: 'SQL', body: `{sql:${sql}, res:${rows ? JSON.stringify(rows, null, 4) : 'null'}}`, threadid, sessionid });
            if (rows)
                result = rows[0];
            break;
        default:
            if (!slug) {
                action = 'insert';
                let slugVerified = false;
                let t = title;
                if (!t)
                    t = description;
                let i = 0;
                let text = t;

                while (!slugVerified) {
                    slug = slugify(t);
                    sql = `SELECT * from reviews where slug='${slug}'`;
                    let result = await query(`SELECT * from reviews where slug=?`, [slug]);
                    dbLog({ query, type: 'slugify', body: JSON.stringify({ slug, sql, result }), threadid, sessionid });

                    if (!result) {
                        slugVerified = true;
                    }
                    else {
                        t = text + `-${i++}`;
                    }
                    if (i > 100) {
                        if (ownConnect)
                            dbEnd();
                        return false;
                    }
                }
            }
            if (action != 'insert') {
                sql = `SELECT * from reviews where slug='${slug}'`;
                let rows = await query(`SELECT * from rfmicrotimeeviews where slug=?`, [slug]);
                if (rows)
                    result = rows[0];
                dbLog({ query, type: 'SQL', body: `{sql:${sql}, res:${rows ? JSON.stringify(rows, null, 4) : 'null'}}`, threadid, sessionid });
                if (result) {
                    if (result.micros < micros) {
                        // title, description, sentiment, url, author, published, micros, slug
                        sql = `UPDATE reviews set title='${title}', description='${description}',sentiment='${sentiment}, url='${url}, author='${author}', published='${publlished}, micros=${micros} where slug='${slug}`;
                        result = await query(`UPDATE from reviews set title=?,description=?,sentiment=?,url=?,author=?,published=?,micros=?  where slug=?`, [title, description, sentiment, url, authorpublished, micros, slug]);
                        dbLog({ query, type: 'SQL', body: `{sql:${sql}, res:${result ? JSON.stringify(result, null, 4) : 'null'}}`, threadid, sessionid });
                    }
                }
                else action == 'insert';
            }
            if (action == 'insert') {
                sql = `INSERT into reviews (title,description,sentiment,url,author,published,micros,slug) VALUES ('${title}','${description}','${sentiment}','${url}','${author}',${published},${micros},'${slug}')`
                result = await query(`INSER into reviews (title,description,sentiment,url,author,published,micros,slug) VALUES (?,?,?,?,?,?,?,?)`, [title, description, sentiment, url, author, published, micros, slug]);
                dbLog({ query, type: 'SQL', body: `{sql:${sql}, res:${result ? JSON.stringify(result, null, 4) : 'null'}}`, threadid, sessionid });
            }
    }
    if (ownConnect)
        dbEnd();
    return result;
}
*/
module.exports = { dbCategory, dbProduct, dbLog, dbStart, dbEnd };