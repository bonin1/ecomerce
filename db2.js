const { Sequelize } = require('sequelize');
require('dotenv').config();

const db2 = new Sequelize(
    process.env.DATABASE_NAME,
    process.env.DATABASE_USER,
    process.env.DATABASE_PASSWORD,
    {
        host: process.env.DATABASE_HOST,
        dialect: 'mysql',
        logging: false,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

const initializeDatabase = async () => {
    try {
        await db2.authenticate();
        console.log('Connection has been established successfully.');
        
        // Force sync in development only
        await db2.sync({ alter: true });
        console.log('Database synchronized');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
};

initializeDatabase();

module.exports = db2;