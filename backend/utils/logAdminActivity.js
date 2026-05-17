const AdminActivityLog = require('../model/AdminActivityLogModel');

function clientIp(req) {
    const xf = req.headers['x-forwarded-for'];
    if (typeof xf === 'string' && xf.length) return xf.split(',')[0].trim().slice(0, 64);
    return (req.ip || '').slice(0, 64) || null;
}

/**
 * @param {import('express').Request} req
 * @param {{ action: string, entity_type: string, entity_id?: number|null, metadata?: object }} payload
 */
async function logAdminActivity(req, { action, entity_type, entity_id = null, metadata = null }) {
    try {
        const u = req.user;
        await AdminActivityLog.create({
            actor_user_id: u?.id ?? null,
            actor_role: u?.role ?? null,
            action,
            entity_type,
            entity_id: entity_id == null ? null : Number(entity_id),
            metadata,
            ip: clientIp(req),
        });
    } catch (e) {
        console.error('[logAdminActivity]', e.message);
    }
}

module.exports = { logAdminActivity, clientIp };
