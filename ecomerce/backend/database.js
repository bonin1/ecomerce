const sequelize = require('sequelize')
require('dotenv').config()


const db = new sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false
})

db.authenticate()
    .then(() => {
        console.log('Database connected')
    })
    .catch((error) => {
        console.error('Error connecting to database:', error)
    })


module.exports = db