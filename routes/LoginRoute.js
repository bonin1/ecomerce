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
const router = express.Router();
const crypto = require('crypto');
require('dotenv').config();
const Footer = require('../Footer')

const  LoginInformation  = require('../Models/LoginModel');


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




router.get('/', (req, res) => {
    const csrfToken = crypto.randomBytes(64).toString('hex');
    req.session.csrfToken = csrfToken;
    res.render('login', { message: '', csrfToken ,footer: Footer()});
});

router.post('/', loginLimiter, async (req, res) => {
    if(req.body._csrf !== req.session.csrfToken) {
        return res.status(401).send('Invalid CSRF token');
    }
    const email = req.body.email;
    const password = req.body.password;

    if (!validator.isEmail(email)) {
        return res.render('login', { message: 'Invalid email address',csrfToken: req.session.csrfToken });
    }

    if (!validator.isLength(password, { min: 8 })) {
        return res.render('login', { message: 'password must be 8 characters',csrfToken: req.session.csrfToken});
    }

    try {
        const user = await LoginInformation.findOne({ where: { email: email } });
        if (!user) {
            return res.render('login', { message: 'incorrect email or password',csrfToken: req.session.csrfToken });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.render('login', { message: 'incorrect email or password',csrfToken: req.session.csrfToken });
        }

        const rememberMe = req.body.rememberMe === 'on';

        if (rememberMe) {
            const rememberToken = crypto.randomBytes(64).toString('hex');
            res.cookie('rememberToken', rememberToken, { maxAge: 30 * 24 * 60 * 60 * 1000 });
        }

        req.session.isLoggedIn = true;
        req.session.userId = user.id;
        res.redirect('/cart');
    } catch (err) {
        console.log(err);
        return res.render('login', { message: 'An error occurred while processing your request', csrfToken: req.session.csrfToken });
    }
});

module.exports = router;
