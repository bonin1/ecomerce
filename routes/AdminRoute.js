const express = require('express')
const session = require('express-session')
const db = require('../databaze')
const bcrypt = require('bcryptjs');
const router = express.Router();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const AdminInformation = require('../Models/AdminModel')

const adminLimiter = rateLimit({
    windowMs: 15*60*1000, 
    max: 5, 
    message: "Too many login attempts, please try again later",
    onLimitReached: (req, res, next) => {
        res.redirect("/");
    }
});



router.use(cookieParser());
require('dotenv').config();
router.use(bodyParser.json()); 
router.use(bodyParser.urlencoded({ extended: true }));

router.use(session({
    secret:process.env.SESSION_SECRET,
    resave:false,
    saveUninitialized:false,
    cookie:{maxAge: 30 * 60 * 1000} 
}))



router.get('/',adminLimiter,(req,res)=>{
    res.render('admin')
})

router.post('/', adminLimiter, (req, res) => {
    const { email, password } = req.body;

    AdminInformation.findOne({ where: { admin_email: email } })
        .then(admin => {
            if (!admin) {
                return res.render('admin', { message: 'Invalid email or password.' });
            }

            bcrypt.compare(password, admin.password, (err, isMatch) => {
                if (err) {
                    console.log(err);
                }
                if (!isMatch) {
                    return res.render('admin', { message: 'Invalid email or password.' });
                }

                req.session.isLogged = email;
                res.redirect('/protected');
            });
        })
        .catch(err => {
            console.log(err);
        });
});


module.exports = router