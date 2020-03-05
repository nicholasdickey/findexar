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
const dbStart = async (server) => {
    if (!server)
        server = {
            host: dbServer,
            user: dbUser,
            password: dbPassword,
            database: dbDatabase
        }
    l("dbStart", server);

    var connection = mysql.createConnection(server);
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
    let { slug, parentSlug, name, description, micros, page, size } = category;
    name = ds(name);
    description = ds(description);
    parentSlug = ds(parentSlug);
    micros = micros || microtime();
    page = page || 0;
    size = size || 25;
    let start = page * size;
    let sql = '';
    let result = false;
    let res = false;
    switch (action) {
        case 'remove':
            //Check if has children
            sql = `SELECT slug from categories where parentSlug='${slug}'`;
            rows = await query(`SELECT slug from categories where parentSlug=?`, [slug]);
            await dbLog({ query, type: 'SQL', body: `{sql:${sql}, res:${rows ? JSON.stringify(rows, null, 4) : 'null'}}`, threadid, sessionid, username });
            if (rows && rows.length)
                result = {
                    success: false,
                    message: 'Unable to delete category: still has children'
                }
            else {
                sql = `DELETE from categories where slug='${slug}'`;
                res = await query(`DELETE from categories where slug=?`, [slug]);
                await dbLog({ query, type: 'SQL', body: `{sql:${sql}, res:${res ? JSON.stringify(res, null, 4) : 'null'}}`, threadid, sessionid, username });
                if (res) {
                    result = {
                        success: true,
                        slug
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
            sql = `SELECT * from categories where slug='${slug}' `;
            let rows = await query(`SELECT * from categories where slug=?`, [slug]);
            await dbLog({ query, type: 'SQL', body: `{sql:${sql}, res:${rows ? JSON.stringify(rows, null, 4) : 'null'}}`, threadid, sessionid, username });
            if (rows && rows.length) {
                /*
                parse parentSlug, and create path of names
                */
                let category = rows[0];
                let parentSlug = category['parentSlug'];
                let path = [];
                if (parentSlug == 'native') {
                    path.push(parentSlug);
                }
                else {
                    let parts = parentSlug.split(':');
                    path.push(...parts);
                }
                category['path'] = JSON.stringify(path);

                result = {
                    success: true,
                    category: category
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
            sql = `SELECT * from categories where parentSlug='${slug}' limit ${start},${size}`;
            let rows = await query(`SELECT * from categories where parentSlug=?  limit ${start},${size}`, [slug]);
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
                    res = await query(`SELECT * from categories where slug=?`, [slug]);
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
                res = false;
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
                                success: true,
                                slug
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
                res = false;
                try {
                    res = await query(`INSERT into categories (name,description,micros,slug,parentSlug,createdBy) VALUES (?,?,?,?,?,?)`, [name, description, micros, slug, parentSlug, username]);
                }
                catch (x) {
                    l("HANDLED DB EXCEPTION:", sql, x)
                }
                await dbLog({ query, type: 'SQL', body: `{sql:${sql}, res:${res ? JSON.stringify(res, null, 4) : 'null'}}`, threadid, sessionid, username });
                if (res && res.affectedRows) {
                    if (parentSlug == 'native') {
                        let parts = slug.split(':');
                        let publicationSlug = parts[1];
                        let publicationCategorySlug = publicationSlug[2];
                        sql = `INSERT into publicationCategories (publicationCategorySlug,publicationSlug,findexarCategorySlug,micros,createdBy) VALUES ('${publicationCategorySlug}','${publicationSlug}','${slug}',${micros},'${username}')`
                        res = false;
                        try {
                            res = await query(`INSERT into publicationCategories (publicationCategorySlug,publicationSlug,findexarCategorySlug,micros,createdBy) VALUES (?,?,?,?,?)`, [publicationCategorySlug, publicationSlug, slug, micros, username]);
                        }
                        catch (x) {
                            l("HANDLED DB EXCEPTION:", sql, x)
                        }
                        await dbLog({ query, type: 'SQL', body: `{sql:${sql}, res:${res ? JSON.stringify(res, null, 4) : 'null'}}`, threadid, sessionid, username });

                    }
                    result = {
                        success: true,
                        slug
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
const dbUserAuth = async ({ query, sessionid, threadid, user, username, action }) => {
    let { slug, role, micros } = user;
    micros = micros || microtime();
    switch (action) {
        case 'fetch': {
            sql = `SELECT * from users where slug='${slug}'`;
            let rows = await query(`SELECT * from users where slug=?`, [slug]);
            await dbLog({ query, type: 'SQL', body: `{sql:${sql}, res:${rows ? JSON.stringify(rows, null, 4) : 'null'}}`, threadid, sessionid, username });
            if (rows && rows.length) {
                result = {
                    success: true,
                    user: rows[0]
                }
            }
            else {
                result = {
                    success: false,
                    message: `No users matched the slug ${slug}`
                }
            }
            break;
        }
        default: {//update,insert

            if (action != 'insert') {
                sql = `SELECT * from users where slug='${slug}'`;
                let rows = await query(`SELECT * from users where slug=?`, [slug]);
                let res = false;
                if (rows)
                    res = rows[0];
                await dbLog({ query, type: 'SQL', body: `{sql:${sql}, res:${rows ? JSON.stringify(rows, null, 4) : 'null'}}`, threadid, sessionid, slug });
                if (res) {
                    if (res.micros < micros) {
                        sql = `UPDATE users set role='${role}, micros=${micros},updatedBy=${username}, updated=now() where slug='${slug}`;
                        res = await query(`UPDATE  users set role=?,micros=?,updatedBy=?,updated=now()  where slug=?`, [role, micros, username, slug]);
                        await dbLog({ query, type: 'SQL', body: `{sql:${sql}, res:${res ? JSON.stringify(res, null, 4) : 'null'}}`, threadid, sessionid, username });
                        if (res && res.affectedRows) {
                            result = {
                                success: true,
                                slug: slug
                            }
                        }
                        else {
                            let cap = JSON.stringify(
                                {
                                    name,
                                    description,
                                    micros,
                                    username,
                                    slug,
                                    categorySlug,
                                    brandSlug
                                }
                            )
                            result = {
                                success: false,
                                message: `Unable to update users with slug ${slug}, update values ${cap}`
                            }
                        }
                    }
                }
                else action = 'insert';
            }
            if (action == 'insert') {
                sql = `INSERT into users (role,micros,slug,createdBy) VALUES ('${role}',${micros},'${slug}','${username}')`
                let res = false;
                try {
                    res = await query(`INSERT into users (role,micros,slug,createdBy) VALUES (?,?,?,?)`, [role, micros, slug, username]);
                }
                catch (x) {
                    l("HANDLED DB EXCEPTION:", x)
                }
                await dbLog({ query, type: 'SQL', body: `{sql:${sql}, res:${res ? JSON.stringify(res, null, 4) : 'null'}}`, threadid, sessionid, username });
                if (res && res.affectedRows) {
                    result = {
                        success: true,
                        slug
                    }
                }
                else {
                    let cap = JSON.stringify({ role, micros, username, slug });
                    result = {
                        success: false,
                        message: `Unable to insert users with slug ${slug}, update values ${cap}`
                    }
                }
            }
        }

    }
    return result;
}
const dbProduct = async ({ query, sessionid, threadid, product, username, action }) => {
    let { slug, categorySlug, oldCategorySlug, name, description, image, imageSrc, sentiment, findex, fakespot, productUrl, vendorUrls, brandSlug, micros, page, size } = product;
    name = ds(name);
    categorySlug = ds(categorySlug) || 'unknown';
    brandSlug = ds(brandSlug) || 'unknown';
    description = ds(description);
    image = ds(image);
    imageSrc = ds(imageSrc);
    sentiment = JSON.stringify(sentiment || {});
    fakesport = JSON.stringify(fakespot || {});
    vendorUrls = JSON.stringify(vendorUrls || {});
    findex = findex || 0;
    productUrl = ds(productUrl);

    micros = micros || microtime();
    page = page || 0;
    size = size || 25;
    let start = page * size;

    let sql = '';
    let result = false;
    switch (action) {
        /*  case 'remove':
              //Check if has children
              sql = `SELECT slug from categories where parentSlug='${slug}'`;
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
            sql = `SELECT * from products where categorySlug='${categorySlug}' order by findex desc  limit ${start},${size}`;
            let rows = await query(`SELECT * from products where categorySlug=? order by findex desc  limit ${start},${size}`, [categorySlug]);
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
                    success: true,
                    slug: categorySlug
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
            sql = `UPDATE products set sentiment='${sentiment}',findex='${findex}',updated=now(),updatedBy='${username}' where slug='${slug}'`;
            let res = await query(`UPDATE products set sentiment=?,findex=?,updated=now(),updatedBy=? where slug=?`, [sentiment, findex, username, slug]);
            await dbLog({ query, type: 'SQL', body: `{sql:${sql}, res:${res ? JSON.stringify(res, null, 4) : 'null'}}`, threadid, sessionid, username });
            if (res) {
                result = {
                    success: true,
                    slug
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
        default: {//update,insert
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
                        sql = `UPDATE products set name='${name}', description='${description}',categorySlug='${categorySlug},brandSlug='${brandSlug}',image='${image}',imageSrc='${imageSrc}',sentiment='${sentiment}',fakespot='${fakespot}' findex='${findex}',productUrl='${productUrl}',vendorUrls='${vendorUrls}', micros=${micros},updatedBy=${username}, updated=now() where slug='${slug}`;
                        res = await query(`UPDATE  products set name=?,description=?,categorySlug=?,brandSlug=?,image=?,imageSrc=?,sentiment=?,fakespot=?,findex=?,productUrl=?,vendorUrls=?,micros=?,updatedBy=?,updated=now()  where slug=?`, [name, description, categorySlug, brandSlug, image, imageSrc, sentiment, fakespot, findex, productUrl, vendorUrls, micros, username, slug]);
                        await dbLog({ query, type: 'SQL', body: `{sql:${sql}, res:${res ? JSON.stringify(res, null, 4) : 'null'}}`, threadid, sessionid, username });
                        if (res && res.affectedRows) {
                            result = {
                                success: true,
                                slug
                            }
                        }
                        else {
                            let cap = JSON.stringify(
                                {
                                    name,
                                    description,
                                    micros,
                                    username,
                                    slug,
                                    categorySlug,
                                    brandSlug
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
                sql = `INSERT into products (name,description,imageSrc,image,sentiment,fakespot,findex,productUrl,vendorUrls,micros,slug,categorySlug,brandSlug,createdBy) VALUES ('${name}','${description}','${imageSrc}','${image}','${sentiment}','${fakespot}','${findex}','${productUrl}','${vendorUrls}',${micros},'${slug}','${categorySlug}','${brandSlug}','${username}')`
                let res = false;
                try {
                    res = await query(`INSERT into products (name,description,imageSrc,image,sentiment,fakespot,findex,productUrl,vendorUrls,micros,slug,categorySlug,brandSlug,createdBy) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [name, description, imageSrc, image, sentiment, fakespot, findex, productUrl, vendorUrls, micros, slug, categorySlug, brandSlug, username]);
                }
                catch (x) {
                    l("HANDLED DB EXCEPTION:", x)
                }
                await dbLog({ query, type: 'SQL', body: `{sql:${sql}, res:${res ? JSON.stringify(res, null, 4) : 'null'}}`, threadid, sessionid, username });
                if (res && res.affectedRows) {
                    result = {
                        success: true,
                        slug
                    }
                }
                else {
                    let cap = JSON.stringify({ name, categorySlug, description, imageSrc, image, sentiment, productUrl, vendorUrls, micros, username, slug });
                    result = {
                        success: false,
                        message: `Unable to insert product with slug ${slug}, update values ${cap}`
                    }
                }
            }
        }
    }

    //l("returning from db.js:", result)
    return result;
}

const dbReview = async ({ query, sessionid, threadid, review, username, action }) => {
    let { slug, productSlug, publicationSlug, title, description, stars, avatar, avatarSrc, sentimentScore, verified, fakespot, url, author, published, location, micros, page, size } = review;
    title = ds(title);
    productSlug = ds(productSlug) || 'unknown';
    publicationSlug = ds(publicationSlug) || 'unknown';
    description = ds(description);
    avatar = ds(avatar);
    avatarSrc = ds(avatarSrc);
    // image = ds(image);
    // imageSrc = ds(imageSrc);
    stars = JSON.stringify(stars || {});
    fakespot = JSON.stringify(fakespot || {});

    sentimentScore = sentimentScore || 0;
    url = ds(url);
    author = ds(author);
    location = ds(location);
    published = published || 0;
    verified = verified || 0;

    micros = micros || microtime();
    page = page || 0;
    size = size || 25;
    let start = page * size;

    let sql = '';
    let result = false;
    switch (action) {

        case 'fetch': {
            sql = `SELECT * from reviews where slug='${slug}'`;
            let rows = await query(`SELECT * from reviews where slug=?`, [slug]);
            await dbLog({ query, type: 'SQL', body: `{sql:${sql}, res:${rows ? JSON.stringify(rows, null, 4) : 'null'}}`, threadid, sessionid, username });
            if (rows && rows.length) {
                result = {
                    success: true,
                    review: rows[0]
                }
            }
            else {
                result = {
                    success: false,
                    message: `No reviews matched the slug ${slug}`
                }
            }
            break;
        }
        case 'fetchByProduct': {
            sql = `SELECT * FROM reviews where productSlug='${productSlug}' order by sentimentScore desc  limit ${start},${size}`;
            let rows = await query(`SELECT * FROM reviews where productSlug=? order by sentimentScore desc  limit ${start},${size}`, [productSlug]);
            await dbLog({ query, type: 'SQL', body: `{sql:${sql}, res:${rows ? JSON.stringify(rows, null, 4) : 'null'}}`, threadid, sessionid, username });
            if (rows && rows.length) {
                result = {
                    success: true,
                    reviews: rows
                }
            }
            else {
                result = {
                    success: false,
                    message: `Unable to fetch reviews by product ${productSlug}`
                }
            }
            break;
        }
        case 'updateSentiment': {
            sql = `UPDATE reviews set sentimentScore='${sentimentScore}',updated=now(),updatedBy='${username}' where slug='${slug}'`;
            let res = await query(`UPDATE reviews set sentimentScore=?,updated=now(),updatedBy=? where slug=?`, [sentimentScore, username, slug]);
            await dbLog({ query, type: 'SQL', body: `{sql:${sql}, res:${res ? JSON.stringify(res, null, 4) : 'null'}}`, threadid, sessionid, username });
            if (res) {
                result = {
                    success: true,
                    slug
                }
            }
            else {
                result = {
                    success: false,
                    message: `Unable to update the product sentiment ${sentimentScore} for ${slug}`
                }
            }
            break;
        }
        case 'updatePublished': {
            sql = `UPDATE reviews set published='${active}' where slug='${slug}'`;
            let res = await query(`UPDATE reviews set published=? where slug=?`, [slug]);
            await dbLog({ query, type: 'SQL', body: `{sql:${sql}, res:${res ? JSON.stringify(res, null, 4) : 'null'}}`, threadid, sessionid, username });
            if (res) {
                result = {
                    success: true,
                    slug
                }
            }
            else {
                result = {
                    success: false,
                    message: `Unable to update the reviews's published for ${slug}`
                }
            }
            break;
        }
        default: //update,insert
            if (!slug) {
                action = 'insert';
                let slugVerified = false;
                let t = title;
                if (!t)
                    t = description;
                let i = 0;
                let text = t;

                while (!slugVerified) {
                    slug = slugify(t, { lower: true });
                    sql = `SELECT * from reviews where slug='${slug}'`;
                    let res = await query(`SELECT * from reviews where slug=?`, [slug]);
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
                sql = `SELECT * from reviews where slug='${slug}'`;
                let rows = await query(`SELECT * from reviews where slug=?`, [slug]);
                let res = false;
                if (rows)
                    res = rows[0];
                await dbLog({ query, type: 'SQL', body: `{sql:${sql}, res:${rows ? JSON.stringify(rows, null, 4) : 'null'}}`, threadid, sessionid, username });
                //slug, productSlug, publicationSlug, title, description, sentiment, sentimentScore, image, imageSrc, url, author, published, micros
                if (res) {
                    if (res.micros < micros) {
                        sql = `UPDATE reviews set productSlug='${productSlug}',publicationSlug='${publicationSlug}',title='${title}', description='${description}',avarar='${avatar}',avatarSrc=${avatarSrc},stars='${stars}',fakespot='${fakespot}',verified='${verified}', sentimentScore=${sentimentScore},url='${url}',author='${author}', published='${published}',location='${location}', micros=${micros},updatedBy=${username}, updated=now() where slug='${slug}`;
                        res = await query(`UPDATE  reviews  set productSlug=?,publicationSlug=?,title=?,description=?,avatar,avatarSrc,stars=?,fakespot=?,veified=?,sentimentScore,url=?,author=?,published=?,location=?,micros=?,updatedBy=?,updated=now()  where slug=?`, [productSlug, pblicationSlug, title, description, avatar, avatarSrc, stars, fakespot, verified, sentimentScore, image, imageSrc, url, author, published, location, micros, username, slug]);
                        await dbLog({ query, type: 'SQL', body: `{sql:${sql}, res:${res ? JSON.stringify(res, null, 4) : 'null'}}`, threadid, sessionid, username });
                        if (res && res.affectedRows) {
                            result = {
                                success: true,
                                slug
                            }
                        }
                        else {
                            let cap = JSON.stringify(
                                {
                                    title,
                                    description,
                                    micros,
                                    username,
                                    avatar,
                                    avatarSrc,
                                    stars,
                                    slug
                                }
                            )
                            result = {
                                success: false,
                                message: `Unable to update review with slug ${slug}, update values ${cap}`
                            }
                        }
                    }
                }
                else action = 'insert';
            }
            if (action == 'insert') {
                sql = `INSERT into reviews (productSlug,publicationSlug,title,description,avatar,avatarSrc,stars,fakespot,verified,sentimentScore,url,author,published,location,micros,slug,createdBy) VALUES ('${productSlug}','${publicationSlug}','${title}','${description}','${avatar}','${avatarSrc}','${stars}','${fakespot}','${verified}',${sentimentScore},'${url}','${author}','${published}','${location}',${micros},'${slug}','${username}')`
                let res = false;
                try {
                    res = await query(`INSERT into reviews (productSlug,publicationSlug,title,description,avatar,avatarSrc,stars,fakespot,verified,sentimentScore,url,author,published,location,micros,slug,createdBy) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [productSlug, publicationSlug, title, description, avatar, avatarSrc, stars, fakespot, verified, sentimentScore, url, author, published, location, micros, slug, username]);
                }
                catch (x) {
                    l("HANDLED DB EXCEPTION:", x)
                }
                await dbLog({ query, type: 'SQL', body: `{sql:${sql}, res:${res ? JSON.stringify(res, null, 4) : 'null'}}`, threadid, sessionid, username });
                if (res && res.affectedRows) {
                    result = {
                        success: true,
                        slug

                    }
                }
                else {
                    let cap = JSON.stringify({ productSlug, publicationSlug, title, published, author, stars, sentimentScore, description, url, micros, username, slug });
                    result = {
                        success: false,
                        message: `Unable to insert review with slug ${slug}, update values ${cap}`
                    }
                }
            }
    }

    // l("returning from db.js:", result)
    return result;
}


const dbPublication = async ({ query, sessionid, threadid, publication, username, action }) => {
    let { slug, name, description, image, imageSrc, cdn, url, active, handler, crawlerEntryUrl, lastCrawled, micros, publicationCategorySlug, findexarCategprySlug, sentimentWeight } = publication;
    name = ds(name);
    description = ds(description);
    image = ds(image);
    imageSrc = ds(imageSrc);
    handler = ds(handler);
    crawlerEntryUrl = ds(crawlerEntryUrl);
    url = ds(url);
    active = active || 0;
    lastCrawled = lastCrawled || 0;
    micros = micros || microtime();
    cdn = cdn || 0;
    sentimentWeight = sentimentWeight || 1000
    let sql = '';
    let result = false;
    switch (action) {
        /*  case 'remove':
              //Check if has children
              sql = `SELECT slug from categories where parentSlug='${slug}'`;
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
        case 'fetchAssociatedCategory': {
            sql = `SELECT * from publicationCategories where publicationCategorySlug='${publicationCategorySlug}' and publicationSlug='${slug}'`;
            let rows = await query(`SELECT * from publicationCategories where publicationSlug=?`, [slug]);
            await dbLog({ query, type: 'SQL', body: `{sql:${sql}, res:${rows ? JSON.stringify(rows, null, 4) : 'null'}}`, threadid, sessionid, username });
            if (rows && rows.length) {
                result = {
                    success: true,
                    findexarCategorySlug: rows[0].findexarCategorySlug
                }
            }
            else {
                result = {
                    success: false,
                    message: `No associated category exist for category ${slug}, publicationCategory ${publicationCategorySlug}`
                }
            }
            break;
        }

        case 'associateCategory': {
            sql = `SELECT micros from publicationCategories where publicationSlug='${slug}'`;
            let rows = await query(`SELECT micros from publicationCategories where publicationSlug=?`, [slug]);
            await dbLog({ query, type: 'SQL', body: `{sql:${sql}, res:${rows ? JSON.stringify(rows, null, 4) : 'null'}}`, threadid, sessionid, username });
            if (rows && rows.length) {
                if (rows[0].micros < micros) {
                    sql = `UPDATE publicationCategories set findexarCategorySlug='${findexarCategprySlug}' where publicationCategorySlug='${publicationCategorySlug}', updated=now(),updatedBy='${username}',micors=${micros}`;
                    let res = await query(`UPDATE publicationCategories set findexarCategorySlug=? where publicationCategorySlug=?, updated=now(),updatedBy=?,micors=?`, [findexarCategprySlug, publicationCategorySlug, username, micros]);
                    await dbLog({ query, type: 'SQL', body: `{sql:${sql}, res:${res ? JSON.stringify(res, null, 4) : 'null'}}`, threadid, sessionid, username });
                    if (res) {
                        result = {
                            success: true,
                            slug
                        }
                    }
                    else {
                        result = {
                            success: false,
                            message: `Unable to associateCategory (update) ${publicationCategorySlug} with ${findexarCategprySlug} for ${slug}`
                        }
                    }
                }
            }
            else {
                sql = `INSERT into publicationCategories (publicationSlug,publicationCategorySlug,findexarCategorySlug,createdBy,micros) VALUES ('${slug}','${publicationCategorySlug}','${findexarCategprySlug}','${username}',${micros})`;
                let res = await query(`INSERT into publicationCategories(publicationSlug, publicationCategorySlug, findexarCategorySlug, createdBy, micros) VALUES(?,?,?,?,?)`, [slug, publicationCategorySlug, findexarCategprySlug, username, micros]);
                await dbLog({ query, type: 'SQL', body: `{sql:${sql}, res:${res ? JSON.stringify(res, null, 4) : 'null'}}`, threadid, sessionid, username });
                if (res) {
                    result = {
                        success: true,
                        slug
                    }
                }
                else {
                    result = {
                        success: false,
                        message: `Unable to associateCategory (insert) ${publicationCategorySlug} with ${findexarCategprySlug} for ${slug}`
                    }
                }
            }
            break;
        }
        case 'fetch': {
            sql = `SELECT * from publications where slug='${slug}'`;
            let rows = await query(`SELECT * from publications where slug=?`, [slug]);
            await dbLog({ query, type: 'SQL', body: `{sql:${sql}, res:${rows ? JSON.stringify(rows, null, 4) : 'null'}}`, threadid, sessionid, username });
            if (rows && rows.length) {
                result = {
                    success: true,
                    publication: rows[0]
                }
            }
            else {
                result = {
                    success: false,
                    message: `No publications matched the slug ${slug}`
                }
            }
            break;
        }
        case 'fetchByOldestCrawled': {
            sql = `SELECT * FROM publications HAVING lastCrawled =MIN(lastCrawled) limit 1`;
            let rows = await query(`SELECT * FROM publications HAVING lastCrawled = MIN(lastCrawled) limit 1`);
            await dbLog({ query, type: 'SQL', body: `{sql:${sql}, res:${rows ? JSON.stringify(rows, null, 4) : 'null'}}`, threadid, sessionid, username });
            if (rows && rows.length) {
                result = {
                    success: true,
                    publication: rows[0]
                }
            }
            else {
                result = {
                    success: false,
                    message: `Unable to fetch the oldest crawled publication`
                }
            }
            break;
        }
        case 'updateLastCrawled': {
            sql = `UPDATE publications set lastCrawled='${lastCrawled}' where slug='${slug}'`;
            let res = await query(`UPDATE publications set lastCrawled=? where slug=?`, [slug]);
            await dbLog({ query, type: 'SQL', body: `{sql:${sql}, res:${res ? JSON.stringify(res, null, 4) : 'null'}}`, threadid, sessionid, username });
            if (res) {
                result = {
                    success: true,
                    slug
                }
            }
            else {
                result = {
                    success: false,
                    message: `Unable to update the publication's lastCrawled for ${slug}`
                }
            }
            break;
        }
        case 'updateActive': {
            sql = `UPDATE publications set active='${active}' where slug='${slug}'`;
            let res = await query(`UPDATE publications set active=? where slug=?`, [CTIVE, slug]);
            await dbLog({ query, type: 'SQL', body: `{sql:${sql}, res:${res ? JSON.stringify(res, null, 4) : 'null'}}`, threadid, sessionid, username });
            if (res) {
                result = {
                    success: true,
                    slug
                }
            }
            else {
                result = {
                    success: false,
                    message: `Unable to update the publication's active for ${slug}`
                }
            }
            break;
        }
        case 'updateSentimentWeight': {
            sql = `UPDATE publications set sentimentWeight='${sentimentWeight}' where slug='${slug}'`;
            let res = await query(`UPDATE publications set sentimentWeight=? where slug=?`, [sentimentWeight, slug]);
            await dbLog({ query, type: 'SQL', body: `{sql:${sql}, res:${res ? JSON.stringify(res, null, 4) : 'null'}}`, threadid, sessionid, username });
            if (res) {
                result = {
                    success: true,
                    slug
                }
            }
            else {
                result = {
                    success: false,
                    message: `Unable to update the publication's sentimentWeight for ${slug}`
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
                    sql = `SELECT * from publications where slug='${slug}'`;
                    let res = await query(`SELECT * from publications where slug=?`, [slug]);
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
                sql = `SELECT * from publications where slug='${slug}'`;
                let rows = await query(`SELECT * from publications where slug=?`, [slug]);
                let res = false;
                if (rows)
                    res = rows[0];
                await dbLog({ query, type: 'SQL', body: `{sql:${sql}, res:${rows ? JSON.stringify(rows, null, 4) : 'null'}}`, threadid, sessionid, username });
                if (res) {
                    if (res.micros < micros) {
                        sql = `UPDATE publications set name='${name}', description='${description}',image='${image}',imageSrc='${imageSrc}',cdn='${cdn}',url='${url}',active='${active}', handler='${handler}',crawlerEntryUrl='${crawlerEntryUrl}', micros=${micros},updatedBy=${username}, sentimentWeight=${sentimentWeight},updated=now() where slug='${slug}`;
                        res = await query(`UPDATE  publications set name=?,description=?,image=?,imageSrc=?,cdn=?,url=?,active=?,handler=?,crawlerEntryUrl=?,micros=?,updatedBy=?,sentimentWeight=?,updated=now()  where slug=?`, [name, description, image, imageSrc, cdn, url, active, handler, crawlerEntryUrl, micros, username, sentimentWeight, slug]);
                        await dbLog({ query, type: 'SQL', body: `{sql:${sql}, res:${res ? JSON.stringify(res, null, 4) : 'null'}}`, threadid, sessionid, username });
                        if (res && res.affectedRows) {
                            result = {
                                success: true,
                                slug
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
                                message: `Unable to update publication with slug ${slug}, update values ${cap}`
                            }
                        }
                    }
                }
                else action = 'insert';
            }
            if (action == 'insert') {
                sql = `INSERT into publications (name,description,imageSrc,image,cdn,url,active,handler,crawlerEntryUrl,micros,slug,sentimentWeight,createdBy) VALUES ('${name}','${description}','${imageSrc}','${image}','${cdn}','${url}','${active}','${handler}','${crawlerEntryUrl}',${micros},'${slug}',${sentimentWeight},${username}')`
                let res = false;
                try {
                    res = await query(`INSERT into publications (name,description,imageSrc,image,cdn,url,active,handler,crawlerEntryUrl,micros,slug,sentimentWeight,createdBy) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`, [name, description, imageSrc, image, cdn, url, active, handler, crawlerEntryUrl, micros, slug, sentimentWeight, username]);
                }
                catch (x) {
                    l("HANDLED DB EXCEPTION:", x)
                }
                await dbLog({ query, type: 'SQL', body: `{sql:${sql}, res:${res ? JSON.stringify(res, null, 4) : 'null'}}`, threadid, sessionid, username });
                if (res && res.affectedRows) {
                    result = {
                        success: true,
                        slug

                    }
                }
                else {
                    let cap = JSON.stringify({ name, cdn, active, handler, crawlerEntryUrl, description, imageSrc, image, url, micros, username, slug, sentimentWeight });
                    result = {
                        success: false,
                        message: `Unable to insert publication with slug ${slug}, update values ${cap}`
                    }
                }
            }
    }

    // l("returning from db.js:", result)
    return result;
}

const dbBrand = async ({ query, sessionid, threadid, brand, username, action }) => {
    let { slug, name, description, image, imageSrc, url, cdn, micros } = brand;
    name = ds(name);
    description = ds(description);
    image = ds(image);
    imageSrc = ds(imageSrc);
    url = ds(url);
    cdn = cdn || 0;
    micros = micros || microtime();

    let sql = '';
    let result = false;
    let res = false;
    switch (action) {
        /*  case 'remove':
              //Check if has children
              sql = `SELECT slug from categories where parentSlug='${slug}'`;
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
            sql = `SELECT * from brands where slug='${slug}'`;
            let rows = await query(`SELECT * from brands where slug=?`, [slug]);
            await dbLog({ query, type: 'SQL', body: `{sql:${sql}, res:${rows ? JSON.stringify(rows, null, 4) : 'null'}}`, threadid, sessionid, username });
            if (rows && rows.length) {
                result = {
                    success: true,
                    brand: rows[0]
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
                    sql = `SELECT * from brands where slug='${slug}'`;
                    let res = await query(`SELECT * from brands where slug=?`, [slug]);
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
                sql = `SELECT * from brands where slug='${slug}'`;
                let rows = await query(`SELECT * from brands where slug=?`, [slug]);
                let res = false;
                if (rows)
                    res = rows[0];
                await dbLog({ query, type: 'SQL', body: `{sql:${sql}, res:${rows ? JSON.stringify(rows, null, 4) : 'null'}}`, threadid, sessionid, username });
                if (res) {
                    if (res.micros < micros) {
                        sql = `UPDATE brands set name='${name}', description='${description}',image='${image}',imageSrc='${imageSrc}',url='${url}', micros=${micros},updatedBy=${username}, updated=now() where slug='${slug}`;
                        res = await query(`UPDATE  brands set name=?,description=?,image=?,imageSrc=?,url=?,micros=?,updatedBy=?,updated=now()  where slug=?`, [name, description, image, imageSrc, url, micros, username, slug]);
                        await dbLog({ query, type: 'SQL', body: `{sql:${sql}, res:${res ? JSON.stringify(res, null, 4) : 'null'}}`, threadid, sessionid, username });
                        if (res && res.affectedRows) {
                            result = {
                                success: true,
                                slug
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
                                message: `Unable to update brand with slug ${slug}, update values ${cap}`
                            }
                        }
                    }
                }
                else action = 'insert';
            }
            if (action == 'insert') {
                sql = `INSERT into brands (name,description,imageSrc,image,url,micros,slug,createdBy) VALUES ('${name}','${description}','${imageSrc}','${image}','${url}',${micros},'${slug}','${username}')`
                let res = false;
                try {
                    res = await query(`INSERT into brands (name,description,imageSrc,image,url,micros,slug,createdBy) VALUES (?,?,?,?,?,?,?,?)`, [name, description, imageSrc, image, url, micros, slug, username]);
                }
                catch (x) {
                    l("HANDLED DB EXCEPTION:", x)
                }
                await dbLog({ query, type: 'SQL', body: `{sql:${sql}, res:${res ? JSON.stringify(res, null, 4) : 'null'}}`, threadid, sessionid, username });
                if (res && res.affectedRows) {
                    result = {
                        success: true,
                        slug
                    }
                }
                else {
                    let cap = JSON.stringify({ name, description, imageSrc, image, url, micros, username, slug });
                    result = {
                        success: false,
                        message: `Unable to insert brand with slug ${slug}, update values ${cap}`
                    }
                }
            }
    }

    l("retrning from db.js:", result)
    return result;
}

module.exports = { dbCategory, dbProduct, dbBrand, dbPublication, dbReview, dbUserAuth, dbLog, dbStart, dbEnd };