const express = require('express');
const app = express();
const session = require('express-session');
const db = require('../databaze');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const csrf = require('csurf');
const validator = require('validator');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const cors = require('cors');
const router = express.Router();
const crypto = require('crypto');
require('dotenv').config();

// Use helmet for security headers
router.use(helmet());


router.use(session({ 
    secret: process.env.SESSION_SECRET, 
    resave: false, 
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: 'strict'
    }
}));
router.use(cookieParser());

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Too many login attempts, please try again later'
});

router.use(bodyParser.json({ limit: '50mb' }));
router.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// router.use((req, res, next) => {
//     const csrfToken = crypto.randomBytes(64).toString('hex');
//     req.session.csrfToken = csrfToken;
//     res.locals.csrfToken = csrfToken;
//     next();
// });

// router.use((req, res, next) => {
//     res.locals.csrfToken = req.session.csrfToken;
//     next();
// });


router.get('/', (req, res) => {
    const csrfToken = crypto.randomBytes(64).toString('hex');
    req.session.csrfToken = csrfToken;
    res.render('login', { message: '', csrfToken });
});

router.post('/', loginLimiter, (req, res) => {
    if(req.body._csrf !== req.session.csrfToken) {
        return res.status(401).send('Invalid CSRF token');
    }
    const email = req.body.email;
    const password = req.body.password;
    
    if (!validator.isEmail(email)) {
        return res.render('login', { message: 'Invalid email address',csrfToken: req.session.csrfToken });
    }

    if (!validator.isLength(password, { min: 8 })) {
        return res.render('login', { message: 'password must me 8 characters',csrfToken: req.session.csrfToken});
    }

    const query = 'SELECT * FROM login_information WHERE email = ?';
    db.query(query, [email], async (err, results, fields) => {
    if (err) {
    console.log(err);
    return res.render('login', { message: 'An error occurred while processing your request', csrfToken: req.session.csrfToken });
    }
    if (results.length === 0 || !(await bcrypt.compare(password, results[0].password))) {
    return res.render('login',{message:'incorrect email or password',csrfToken: req.session.csrfToken})
    }
    
        req.session.isLoggedIn = true;
        req.session.userId = results[0].id;
        res.redirect('/cart');
    });
})


module.exports = router;