const { Op } = require('sequelize');
const User = require('../../model/UserModel');
const { logAdminActivity } = require('../../utils/logAdminActivity');

const ROLE_VALUES = ['admin', 'user', 'staff', 'superadmin', 'moderator', 'guest', 'banned'];
const PRIVILEGED_ROLES = ['admin', 'superadmin'];
const STAFF_SAFE_ROLES = ['user', 'staff', 'moderator', 'guest', 'banned'];

function canAssignRole(actorRole, newRole) {
    if (PRIVILEGED_ROLES.includes(newRole)) {
        return actorRole === 'superadmin';
    }
    if (actorRole === 'staff') {
        return STAFF_SAFE_ROLES.includes(newRole);
    }
    return ['admin', 'superadmin'].includes(actorRole);
}

exports.listUsers = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
        const offset = (page - 1) * limit;
        const search = (req.query.search || '').trim();
        const role = (req.query.role || '').trim();

        const where = {};
        if (search) {
            const term = `%${search}%`;
            where[Op.or] = [
                { name: { [Op.like]: term } },
                { lastname: { [Op.like]: term } },
                { email: { [Op.like]: term } },
            ];
        }
        if (role && ROLE_VALUES.includes(role)) {
            where.role = role;
        }

        const { rows, count } = await User.findAndCountAll({
            where,
            attributes: [
                'id',
                'name',
                'lastname',
                'email',
                'role',
                'verified',
                'account_locked',
                'last_login_ip',
                'phone_number',
                'city',
                'createdAt',
            ],
            order: [['createdAt', 'DESC']],
            limit,
            offset,
        });

        return res.json({
            success: true,
            data: rows,
            meta: {
                page,
                limit,
                total: count,
                pages: Math.ceil(count / limit) || 1,
            },
        });
    } catch (error) {
        console.error('listUsers:', error);
        return res.status(500).json({ success: false, message: 'Failed to load users' });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (!Number.isFinite(id)) {
            return res.status(400).json({ success: false, message: 'Invalid user id' });
        }

        const actor = req.user;
        const actorId = Number(actor?.id);
        const targetId = Number(id);
        if (Number.isFinite(actorId) && Number.isFinite(targetId) && actorId === targetId) {
            return res.status(400).json({
                success: false,
                message:
                    'You cannot change your own role, lock or verify status, or remove yourself from the admin user list. Use your profile or ask another administrator.',
            });
        }

        const target = await User.findByPk(id);
        if (!target) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (target.role === 'superadmin' && actor.role !== 'superadmin') {
            return res.status(403).json({ success: false, message: 'Cannot modify this account' });
        }

        const { role, account_locked, verified } = req.body || {};
        const updates = {};

        if (typeof account_locked === 'boolean') {
            updates.account_locked = account_locked;
        }
        if (typeof verified === 'boolean') {
            updates.verified = verified;
        }

        if (role !== undefined && role !== null) {
            if (!ROLE_VALUES.includes(role)) {
                return res.status(400).json({ success: false, message: 'Invalid role' });
            }
            if (!canAssignRole(actor.role, role)) {
                return res.status(403).json({ success: false, message: 'Insufficient privileges for this role' });
            }
            updates.role = role;
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ success: false, message: 'No valid fields to update' });
        }

        const before = {
            role: target.role,
            account_locked: target.account_locked,
            verified: target.verified,
        };

        await target.update(updates);

        await logAdminActivity(req, {
            action: 'admin.user.patch',
            entity_type: 'user',
            entity_id: id,
            metadata: { before, updates },
        });

        const fresh = await User.findByPk(id, {
            attributes: [
                'id',
                'name',
                'lastname',
                'email',
                'role',
                'verified',
                'account_locked',
                'last_login_ip',
                'phone_number',
                'city',
                'createdAt',
            ],
        });

        return res.json({ success: true, data: fresh });
    } catch (error) {
        console.error('updateUser:', error);
        return res.status(500).json({ success: false, message: 'Failed to update user' });
    }
};
