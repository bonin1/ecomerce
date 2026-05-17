const PlatformSetting = require('../model/PlatformSettingModel');

let cached = { at: 0, readonly: false };

async function loadReadonlyFlag() {
    if (Date.now() - cached.at < 15000) return cached.readonly;
    try {
        const row = await PlatformSetting.findByPk('staff_readonly');
        const v = row?.value;
        const on = v === true || v === 1 || (typeof v === 'object' && v && v.enabled === true);
        cached = { at: Date.now(), readonly: !!on };
        return cached.readonly;
    } catch {
        cached = { at: Date.now(), readonly: false };
        return false;
    }
}

/** When platform flag is on, staff cannot mutate admin APIs (GET still allowed). */
module.exports = async function staffReadOnlyBlock(req, res, next) {
    const role = String(req.user?.role || '').toLowerCase();
    if (role !== 'staff') return next();

    const method = String(req.method || 'GET').toUpperCase();
    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return next();

    const ro = await loadReadonlyFlag();
    if (!ro) return next();

    return res.status(503).json({
        success: false,
        message: 'Staff read-only mode is enabled. Only viewing is allowed until an administrator turns it off.',
    });
};
