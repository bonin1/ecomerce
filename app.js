const express = require('express')
const app = express()
const session = require('express-session')
const db = require('./databaze')
const bcrypt = require('bcryptjs');
const { render } = require('ejs');

app.use('/static',express.static('static'))
app.set('view engine','ejs')
app.use(express.urlencoded({extended:false}))
app.use(express.json())
//cookies
app.use(session({
    secret:process.env.SESSION_SECRET,
    resave:false,
    saveUninitialized:false,
    cookie:{maxAge: 10 * 5000} //5 minuta 
}))
app.get('/protected', (req, res) => {
    if (!req.session.isLogged) {
        return res.redirect('/admin');
    }
    db.query(`SELECT * FROM login_information`, (err, results) => {
        if (err) {
            console.error(err);
            return;
        }
        res.render('protected', { data: results });
    });
});
app.get('/search', (req, res) => {
    const keyword = req.query.keyword;
    const query = `SELECT id, emri, email FROM login_information WHERE id LIKE ? OR emri LIKE ? OR email LIKE ?`;
    const values = [`%${keyword}%`, `%${keyword}%`,`%${keyword}%`];
    if (!keyword) {
        return res.redirect('/protected');
    }

    db.query(query, values, (err, results, fields) => {
        if (err) {
            console.error(err);
            return;
        } 
        res.json(results);
        console.log(results);

    });
});




app.get('/',(req,res)=>{
    res.render('home')
})
app.get('/register',(req,res)=>{
    res.render('register',{message:''})
})

app.get('/changepassword',(req,res)=>{
    res.render('changepassword')
})
app.get('/admin',(req,res)=>{
    res.render('admin')
})

app.get('/login',(req,res)=>{
    res.render('login',{message:''})
})

app.delete('/delete/:id', (req, res) => {
    db.execute(`DELETE FROM login_information WHERE id = ?`, [req.params.id]);
    res.sendStatus(200);
    });

app.get('/profile',(req,res)=>{
    const data = JSON.parse(decodeURIComponent(req.query.data));
    res.render('profile', { data });
})


app.post('/logout',(req,res)=>{
    req.session.destroy(err=>{
        if(err){
            console.log(console.err)
        }
        
        res.redirect('/login')
        })
    })



app.post('/create',(req,res)=>{
    const{emri,mbiemri,email,password,oldpassword,status} = req.body
    const query = `SELECT email FROM login_information WHERE email = ? `
    db.query(query,email,async(err,results,fields)=>{
        if(err){
            console.log(err)
        }
        if(results.length > 0){
            return res.render('register',{message:'This email exists'})
        }
        if(password != oldpassword){
            return res.render('register',{message:'password do not match'})
        }
        let hashpassword = await bcrypt.hash(password,8)
        const iquery = `INSERT INTO login_information (emri,mbiemri,email,password) VALUES (?,?,?,?)`;
        const data = [emri, mbiemri, email, hashpassword];
        db.query(iquery, data, (error, results, fields) => {
            if (error) {
                console.log(error);
            }
            res.render('login', { message: '' });
        });
    })
})




app.post('/login',(req,res)=>{
    const {email,password} = req.body
    const query =`SELECT * FROM login_information WHERE email = ?`
    
    
    db.query(query,email, async(err,results,fields)=>{
        if(err){
            console.log(err)
        }
        if(results.length == 0 || !(await bcrypt.compare(password,results[0].password))) {
            return res.render('login',{message:'passwordin ose emailin e ki keq'})
        }
        req.session.isLogged = email
        res.redirect(`/profile?data=${encodeURIComponent(JSON.stringify(results))}`);
    })
})

app.post('/changepassword',(req,res)=>{
    const{email,oldpassword,newpassword} = req.body
    const query = `SELECT password FROM login_information WHERE email = ?`
    db.query(query,email,(err,results)=>{
        if(err){
            console.log(err)
        }
        if(results.length == 0){
            res.redirect('/')
            console.log('Your old password is wrong!')
        }
        const dbPass = results[0].password
        bcrypt.compare(oldpassword,dbPass,(err,results)=>{
            if(!results){
                console.log('Your old password doesnt match')
                res.redirect('/')
            }
            else{
                bcrypt.hash(newpassword,8,(err,hash)=>{
                    const updatequery = `UPDATE login_information SET password = ? WHERE email = ?`;
                    const data = [hash, email];
                    db.execute(updatequery, data, (error, results) => {
                        if (error) {
                        console.log(error);
                            } else {
                    console.log('Your password is changed');
                        res.redirect('/');
                            }
                    });
                })
            }
        })
    })
})


app.post('/admin',(req,res)=>{
    const {email,password} = req.body
    const query =`SELECT * FROM admin_information WHERE admin_email = ?`
    db.query(query,[email], async(err,results,fields)=>{
        if(err){
            console.log(err)
        }
        if(results.length == 0 || !(await bcrypt.compare(password,results[0].password))) {
            return res.render('admin',{message:'passwordi ose emaili jon keq'})
        }
        req.session.isLogged = email
        res.redirect('/protected')
    })
})




const middleware = (req,res,next)=>{
    if(!req.session.isLogged){
        res.redirect('/admin')
    }
    else{
        next()
    }
}
app.get('/protected',middleware,(req,res)=>{
    res.render('protected')
})




app.listen(8080,()=>{
    console.log('Ready!')
})