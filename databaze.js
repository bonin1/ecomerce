const mysql = require('mysql2')
require('dotenv').config()

const db = mysql.createPool({
    host:process.env.DATABASE_HOST,
    user:process.env.DATABASE_USER,
    database:process.env.DATABASE_NAME
})

module.exports = db