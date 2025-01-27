const checkAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('Missing Authorization header');
    }
    next();
};

module.exports = { checkAuth };
