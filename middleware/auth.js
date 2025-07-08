const errorr = 'Error 403 : Access denied';

const ROLES = {
    USER: 1,
    ADMIN: 2,
};

module.exports = {
    ROLES,
    isAuthenticated: (req, res, next) => {
        if (req.session.user) return next();
        return res.redirect('/login');
    },
    isAdmin: (req, res, next) => {
        if (req.session.user?.role === ROLES.ADMIN) return next();
        console.warn(`⚠️ Unauthorized access attempt by user: ${req.session.user?.username || 'unknown'}`);
        return res.status(403).render('error', { message: errorr });
    },
    hasRole: (role) => (req, res, next) => {
        if (req.session.user?.role === role) return next();
        return res.status(403).render('error', { message: errorr });
    }
};