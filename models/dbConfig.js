const pgp = require('pg-promise')({capSQL: true});

const config = {
    user: 'postgres',
    host: 'localhost',
    database: 'payment',
    password: '25251325@Akk',
    port: 5432,
    max: 30,
};

const db = pgp(config);
module.exports = db;