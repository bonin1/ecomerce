const express = require('express');
const bcrypt = require('bcryptjs');
const validator = require('validator');
const router = express.Router();
const crypto = require('crypto');
require('dotenv').config();

const  LoginInformation  = require('../model/UserModel');



const { GetLoginPath } = require('../controller/Login/Path');

router.get('/', GetLoginPath);


router.post('/', async (req, res) => {
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
