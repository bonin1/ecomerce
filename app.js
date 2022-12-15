const express = require('express')
const app = express()
const session = require('express-session')
const db = require('./databaze')
const bcrypt = require('bcryptjs');

app.use('/static',express.static('static'))
app.set('view engine','ejs')
app.use(express.urlencoded({extended:false}))
app.use(express.json())
//cookies
app.use(session({
    secret:process.env.SESSION_SECRET,
    resave:false,
    saveUninitialized:false,
    cookie:{maxAge: 10 * 1000} //1 minut 
}))
app.get('/protected',(req,res)=>{
    db.query(`SELECT * FROM login_information`,(err,results)=>{
        if(err){
            console.log(err)
        }
        res.render('protected',{data:results})
    })
})


app.get('/',(req,res)=>{
    res.render('home')
})
app.get('/register',(req,res)=>{
    res.render('register',{message:''})
})
app.get('/login',(req,res)=>{
    res.render('login',{message:''})
})
app.get('/changepassword',(req,res)=>{
    res.render('changepassword')
})
app.get('/profile',(req,res)=>{
    res.render('profile')
})
app.get('/admin',(req,res)=>{
    res.render('admin')
})
app.get('/protected',(req,res)=>{
    res.render('protected')
})

app.post('/delete/:id',(req,res)=>{
    db.execute(`DELETE FROM admin_information WHERE id = ?`,[req.params.id])
    res.redirect('/protected')
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
    const{emri,mbiemri,email,password,oldpassword} = req.body
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
        const iquery = `INSERT INTO login_information (emri,mbiemri,email,password) VALUES ('${emri}','${mbiemri}','${email}','${hashpassword}')`
        db.query(iquery,(err,results,fields)=>{
            if(err){
                console.log(err)
            }
            res.render('login',{message:''})
        })
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
            return res.render('login',{message:'Your email or password is wrong!'})
        }
        req.session.isLogged = email
        res.render('profile',{data:results})
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
                    const updatequery = `UPDATE login_information SET password = '${hash}' WHERE email = '${email}'`
                    db.execute(updatequery)
                    console.log('Your password is changed')
                    res.redirect('/')
                })
            }
        })
    })
})


app.post('/admin',(req,res)=>{
    const {email,password} = req.body
    const query =`SELECT * FROM admin_information WHERE admin_email = '${email}'`
    db.query(query, async(err,results,fields)=>{
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