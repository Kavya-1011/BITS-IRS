const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.POSTGRES_USER || 'irsadmin',
    host: 'localhost',
    database: process.env.POSTGRES_DB || 'irsdb',
    password: process.env.POSTGRES_PASSWORD || 'irspassword',
    port: 5432,
});

module.exports = {
    query: (text, params) => pool.query(text, params),
};