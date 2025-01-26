const verificationSuccessMiddleware = (req, res, next) => {
    if (!req.session.verificationSuccess) {
        return res.redirect('/login');
    }
    delete req.session.verificationSuccess;
    delete req.session.verifiedEmail;
    next();
};

const staticRoutes = [
    { path: '/register', view: 'register' },
    { path: '/login', view: 'login' },
    { path: '/verify-email', view: 'verifyEmail', data: (req) => ({ email: req.query.email }) },
    { 
        path: '/verification-success', 
        view: 'verificationSuccess',
        middleware: verificationSuccessMiddleware 
    }
];

exports.setupStaticRoutes = (app) => {
    staticRoutes.forEach(route => {
        const handlers = [
            ...(route.middleware ? [route.middleware] : []),
            (req, res) => {
                const viewData = route.data ? route.data(req) : {};
                res.render(route.view, viewData);
            }
        ];
        app.get(route.path, handlers);
    });
};