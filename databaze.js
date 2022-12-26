const mysql = require('mysql2')
require('dotenv').config()
const bcrypt = require('bcryptjs');

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    database: process.env.DATABASE_NAME
});




db.connect();

db.query('CREATE DATABASE IF NOT EXISTS ecomercedb;', (error, results) => {
    if (error) {
        console.error(error);
    } else {
        console.log('Database created successfully');
    }
});


db.query(
    `CREATE TABLE IF NOT EXISTS admin_information (
        admin_email VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        PRIMARY KEY (admin_email)
    );`,
    (error, results) => {
        if (error) {
            console.error(error);
        } else {
            console.log('Table created successfully');
        }
    }
);
db.query(
    `CREATE TABLE IF NOT EXISTS login_information (
        id INT NOT NULL AUTO_INCREMENT,
        emri VARCHAR(255) NOT NULL,
        mbiemri VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        oldpassword VARCHAR(255) NOT NULL,
        PRIMARY KEY (id)
    );`,
    (error, results) => {
        if (error) {
            console.error(error);
        } else {
            console.log('Table created successfully');
        }
    }
);

db.query(
    `CREATE TABLE IF NOT EXISTS produktet (
        emri_produktit MEDIUMTEXT NOT NULL,
        pershkrimi_produktit LONGTEXT NOT NULL,
        cmimi_produktit LONGTEXT NOT NULL,
        origjina_produktit MEDIUMTEXT NOT NULL,
        sasia_produktit INT(255) NOT NULL,
        id BIGINT NOT NULL AUTO_INCREMENT,
        kategoria TEXT DEFAULT NULL,
        PRIMARY KEY (id)
    );`,
    (error, results) => {
        if (error) {
            console.error(error);
        } else {
            console.log('Table created successfully');
        }
    }
);
db.query(
    `CREATE TABLE IF NOT EXISTS cart (
        id INT NOT NULL AUTO_INCREMENT,
        product_id BIGINT NOT NULL,
        FOREIGN KEY (product_id) REFERENCES produktet(id),
        quantity INT NOT NULL DEFAULT 1,
        user_id INT DEFAULT NULL,
        PRIMARY KEY (id)
    );`,
    (error, results) => {
        if (error) {
            console.error(error);
        } else {
            console.log('Table created successfully');
        }
    }
);

db.query('USE ecomercedb;', (error, results) => {
    if (error) {
        console.error(error);
    } else {
        bcrypt.hash('admin123', 10, (error, hashedPassword) => {
            if (error) {
                console.error(error);
            } else {
                db.query(
                    `INSERT INTO admin_information (admin_email, password)
                    SELECT * FROM (SELECT 'tfortit@gmail.com', ?) AS tmp
                    WHERE NOT EXISTS (
                    SELECT admin_email FROM admin_information WHERE admin_email = 'tfortit@gmail.com'
                    ) LIMIT 1`,
                    [hashedPassword],
                    (error, results) => {
                        if (error) {
                            console.error(error);
                        } else {
                            console.log('Email and password inserted successfully');
                        }
                    }
                );
            }
        });
    }
});





module.exports = db