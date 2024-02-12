const express = require('express');
const app = express();
const db = require('../databaze');
const bcrypt = require('bcryptjs');
const router = express.Router();
require('dotenv').config();
const Footer = require('../Footer')

router.get('/',(req,res)=>{
    const isLoggedIn = req.session.isLoggedIn;
    res.render('register',{message:'', isLoggedIn, footer : Footer()})
})

router.post('/',(req,res)=>{
    const{emri,mbiemri,email,password,oldpassword,status} = req.body
    const query = `SELECT email FROM login_information WHERE email = ? `
    db.query(query,email,async(err,results,fields)=>{
        if(err){
            console.log(err)
        }
        if (!email || !password || !oldpassword) {
            return res.status(400).render('register', { message: 'Please provide all necessary fields.' });
        }
        if(results.length > 0){
            return res.render('register',{message:'Ky email eksziston!'})
        }
        if(password != oldpassword){
            return res.render('register',{message:'Fjalkalimi nuk perputhet!'})
        }
        let hashpassword = await bcrypt.hash(password,8)
        const iquery = `INSERT INTO login_information (emri,mbiemri,email,password) VALUES (?,?,?,?)`;
        const data = [emri, mbiemri, email, hashpassword];
        db.query(iquery, data, (error, results, fields) => {
            if (error) {
                console.log(error);
            }
            res.redirect('/login');
        });
    })
})


module.exports = router