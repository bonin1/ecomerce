const crypto = require('crypto');


exports.GetLoginPath = (req, res) => {
    const csrfToken = crypto.randomBytes(64).toString('hex');
    req.session.csrfToken = csrfToken;
    res.render('login', { message: '', csrfToken});
};