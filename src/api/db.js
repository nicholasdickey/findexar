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
const dbEnd = ({ connection }) => {
    connection.end();
}
const ds = (s => s || "")
const dbLog = async ({ query, type, body, threadid, sessionid, username }) => {
    let sql = "SELECT enabled,username from dblog_config limit 1";
    let rows = await query(sql);
    l(chalk.red("LOG:", sql, rows))
    let enabled = rows ? rows[0]['enabled'] : 0;
    let enabledUsername = rows ? rows[0]['username'] : '';
    username = ds(username);
    if (enabled == 1 && (!enabledUsername || enabledUsername == username)) {
        sql = `INSERT into dblog (type,threadid,body,logtime,sessionid,username) VALUES (?,?,?,?,?,?)`;
        await query(sql, [type, threadid, body, microtime(), sessionid])
    }
}
const dbCategory = async ({ query, sessionid, threadid, category, username, action }) => {
    let { slug, parentSlug, name, description, micros } = category;
    name = ds(name);
    description = ds(description);
    micros = micros || microtime();


    let sql = '';
    let result = false;

    switch (action) {
        case 'remove':
            sql = `DELETE from categories where slug='${slug}'`;
            result = await query(`DELETE from categories where slug=?`, [slug]);
            dbLog({ query, type: 'SQL', body: `{sql:${sql}, res:${result ? JSON.stringify(result, null, 4) : 'null'}}`, threadid, sessionid, username });
            break;
        case 'fetch': {
            sql = `SELECT * from categories where slug='${slug}'`;
            let rows = await query(`SELECT * from categories where slug=?`, [slug]);
            dbLog({ query, type: 'SQL', body: `{sql:${sql}, res:${rows ? JSON.stringify(rows, null, 4) : 'null'}}`, threadid, sessionid, username });
            if (rows)
                result = rows[0];
            break;
        }
        case 'fetchChildren': {
            sql = `SELECT * from categories where parentSlug='${parentSlug}'`;
            let rows = await query(`SELECT * from categories where parentSlug=?`, [parentSlug]);
            dbLog({ query, type: 'SQL', body: `{sql:${sql}, res:${rows ? JSON.stringify(rows, null, 4) : 'null'}}`, threadid, sessionid, username });
            if (rows)
                result = rows[0];
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
                    slug = slugify(t);
                    sql = `SELECT * from categories where slug='${slug}'`;
                    let result = await query(`SELECT * from categories where slug=?`, [slug]);
                    dbLog({ query, type: 'slugify', body: JSON.stringify({ slug, sql, result }), threadid, sessionid, username });

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
                if (rows)
                    result = rows[0];
                dbLog({ query, type: 'SQL', body: `{sql:${sql}, res:${rows ? JSON.stringify(rows, null, 4) : 'null'}}`, threadid, sessionid, username });
                if (result) {
                    if (result.micros < micros) {
                        // title, description, sentiment, url, author, published, micros, slug
                        sql = `UPDATE categories set name='${name}', description='${description}',parentSlug='${parentSlug}, micros=${micros},updatedBy=${username} where slug='${slug}`;
                        result = await query(`UPDATE from categproes set name=?,description=?,micros=?,updatedBy=?  where slug=?`, [title, description, micros, username, slug]);
                        dbLog({ query, type: 'SQL', body: `{sql:${sql}, res:${result ? JSON.stringify(result, null, 4) : 'null'}}`, threadid, sessionid, username });
                    }
                }
                else action == 'insert';
            }
            if (action == 'insert') {
                sql = `INSERT into categories (name,description,micros,slug,parentSlug,createdBy) VALUES ('${name}','${description}',${micros},'${slug}','${parentSlug}','${username}')`
                result = await query(`INSERT into categories (name,description,micros,slug,parentSlug,createdBy) VALUES (?,?,?,?,?)`, [name, description, micros, slug, parentSlug, username]);
                dbLog({ query, type: 'SQL', body: `{sql:${sql}, res:${result ? JSON.stringify(result, null, 4) : 'null'}}`, threadid, sessionid });
            }
    }
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
                let rows = await query(`SELECT * from reviews where slug=?`, [slug]);
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
module.exports = { dbCategory, dbLog, dbStart, dbEnd };