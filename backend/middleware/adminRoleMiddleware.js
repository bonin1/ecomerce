/**
 * Requires an admin-panel user with full admin privileges (not staff-only).
 * Use after authenticateAdmin.
 */
exports.requireFullAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required.',
        });
    }
    if (!['admin', 'superadmin'].includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            message: 'This action requires an administrator account.',
        });
    }
    next();
};
