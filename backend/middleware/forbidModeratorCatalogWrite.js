/**
 * Moderators may review/moderate content but must not change catalog data.
 * Use after `authenticate` + `isAdminOrStaff` on product/category mutation routes.
 */
module.exports = function forbidModeratorCatalogWrite(req, res, next) {
    if (req.user && String(req.user.role).toLowerCase() === 'moderator') {
        return res.status(403).json({
            success: false,
            message: 'Moderators cannot modify catalog or inventory. Ask an administrator.',
        });
    }
    next();
};
