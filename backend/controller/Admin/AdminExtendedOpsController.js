const { Op } = require('sequelize');
const db = require('../../database');
const AdminActivityLog = require('../../model/AdminActivityLogModel');
const PlatformSetting = require('../../model/PlatformSettingModel');
const MarketingConsentLog = require('../../model/MarketingConsentLogModel');
const Order = require('../../model/OrderModel');
const OrderItem = require('../../model/OrderItemModel');
const User = require('../../model/UserModel');
const OrderRiskFlag = require('../../model/OrderRiskFlagModel');
const OrderShipment = require('../../model/OrderShipmentModel');
const ReturnRequest = require('../../model/ReturnRequestModel');
const Coupon = require('../../model/CouponModel');
const ContentFlag = require('../../model/ContentFlagModel');
const AdminOrderNote = require('../../model/AdminOrderNoteModel');
const AdminUserNote = require('../../model/AdminUserNoteModel');
const ProductCostSheet = require('../../model/ProductCostSheetModel');
const Produkt = require('../../model/ProduktModel');
const { logAdminActivity } = require('../../utils/logAdminActivity');

const isSuper = (req) => String(req.user?.role).toLowerCase() === 'superadmin';
const isFullAdmin = (req) => ['admin', 'superadmin'].includes(String(req.user?.role).toLowerCase());

const COUPON_WRITABLE_FIELDS = [
    'code',
    'discount_type',
    'discount_value',
    'max_uses',
    'starts_at',
    'ends_at',
    'product_ids',
    'category_ids',
    'stackable',
    'active',
];

function parseIdList(val) {
    if (val === undefined || val === null || val === '') return null;
    if (Array.isArray(val)) {
        const n = val.map((x) => parseInt(x, 10)).filter((x) => !Number.isNaN(x));
        return n.length ? n : null;
    }
    if (typeof val === 'string') {
        const n = val
            .split(/[\s,]+/)
            .filter(Boolean)
            .map((x) => parseInt(x, 10))
            .filter((x) => !Number.isNaN(x));
        return n.length ? n : null;
    }
    return null;
}

/**
 * Build a safe payload for Coupon create/update (no used_count / id injection).
 */
function normalizeCouponBody(body, { isUpdate }) {
    const src = body && typeof body === 'object' ? body : {};
    const out = {};
    for (const k of COUPON_WRITABLE_FIELDS) {
        if (Object.prototype.hasOwnProperty.call(src, k)) {
            out[k] = src[k];
        }
    }

    if (out.code !== undefined) {
        out.code = String(out.code).trim().toUpperCase().slice(0, 64);
        if (!out.code) {
            throw new Error('Coupon code cannot be empty');
        }
    } else if (!isUpdate) {
        throw new Error('Coupon code is required');
    }

    const discountType = out.discount_type ?? (isUpdate ? undefined : src.discount_type);
    if (!isUpdate || out.discount_type !== undefined) {
        if (!['percent', 'fixed'].includes(String(discountType))) {
            throw new Error('discount_type must be percent or fixed');
        }
        out.discount_type = discountType;
    }

    if (!isUpdate || out.discount_value !== undefined) {
        const dv = Number(out.discount_value);
        if (Number.isNaN(dv) || dv < 0) {
            throw new Error('discount_value must be a non-negative number');
        }
        const dt = out.discount_type || src.discount_type;
        if (dt === 'percent' && dv > 100) {
            throw new Error('Percent discount cannot exceed 100');
        }
        out.discount_value = dv;
    }

    if (Object.prototype.hasOwnProperty.call(out, 'max_uses')) {
        if (out.max_uses === '' || out.max_uses === null) {
            out.max_uses = null;
        } else {
            const m = parseInt(out.max_uses, 10);
            if (Number.isNaN(m) || m < 0) {
                throw new Error('max_uses must be a non-negative integer or empty');
            }
            out.max_uses = m;
        }
    }

    ['starts_at', 'ends_at'].forEach((f) => {
        if (!Object.prototype.hasOwnProperty.call(out, f)) return;
        if (out[f] === '' || out[f] === null) {
            out[f] = null;
            return;
        }
        const d = new Date(out[f]);
        if (Number.isNaN(d.getTime())) {
            throw new Error(`Invalid ${f}`);
        }
        out[f] = d;
    });

    if (Object.prototype.hasOwnProperty.call(out, 'product_ids')) {
        out.product_ids = parseIdList(out.product_ids);
    }
    if (Object.prototype.hasOwnProperty.call(out, 'category_ids')) {
        out.category_ids = parseIdList(out.category_ids);
    }
    if (Object.prototype.hasOwnProperty.call(out, 'stackable')) {
        out.stackable = Boolean(out.stackable);
    }
    if (Object.prototype.hasOwnProperty.call(out, 'active')) {
        out.active = Boolean(out.active);
    }

    return out;
}

exports.listActivityLogs = async (req, res) => {
    try {
        if (!isFullAdmin(req)) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 40));
        const offset = (page - 1) * limit;
        const { entity_type, action, from, to } = req.query;
        const where = {};
        if (entity_type) where.entity_type = String(entity_type);
        if (action) where.action = { [Op.like]: `%${String(action)}%` };
        if (from || to) {
            where.createdAt = {};
            if (from) where.createdAt[Op.gte] = new Date(String(from));
            if (to) {
                const t = new Date(String(to));
                t.setHours(23, 59, 59, 999);
                where.createdAt[Op.lte] = t;
            }
        }
        const { rows, count } = await AdminActivityLog.findAndCountAll({
            where,
            order: [['createdAt', 'DESC']],
            limit,
            offset,
        });
        return res.json({
            success: true,
            data: rows,
            meta: { page, limit, total: count, pages: Math.ceil(count / limit) || 1 },
        });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ success: false, message: 'Failed to load activity logs' });
    }
};

exports.exportActivityLogsCsv = async (req, res) => {
    try {
        if (!isFullAdmin(req)) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }
        const rows = await AdminActivityLog.findAll({
            order: [['createdAt', 'DESC']],
            limit: 5000,
        });
        const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
        const header = ['id', 'createdAt', 'actor_user_id', 'actor_role', 'action', 'entity_type', 'entity_id', 'ip', 'metadata'];
        const lines = [header.join(',')];
        for (const r of rows) {
            lines.push(
                [
                    r.id,
                    r.createdAt?.toISOString?.() || r.createdAt,
                    r.actor_user_id,
                    r.actor_role,
                    r.action,
                    r.entity_type,
                    r.entity_id,
                    r.ip,
                    JSON.stringify(r.metadata || {}),
                ]
                    .map(esc)
                    .join(',')
            );
        }
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="admin-activity.csv"');
        return res.send(lines.join('\n'));
    } catch (e) {
        console.error(e);
        return res.status(500).json({ success: false, message: 'Export failed' });
    }
};

exports.getPlatformSettings = async (req, res) => {
    try {
        if (!isFullAdmin(req)) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }
        const rows = await PlatformSetting.findAll({ order: [['key', 'ASC']] });
        const map = {};
        for (const r of rows) map[r.key] = r.value;
        const defaults = {
            staff_readonly: false,
            maintenance_banner: '',
            feature_home_trending: true,
            feature_home_hero: true,
            low_stock_threshold: 5,
            order_sla_respond_hours: 24,
            order_sla_ship_hours: 72,
            anonymize_orders_after_years: 7,
        };
        return res.json({ success: true, data: { ...defaults, ...map } });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ success: false, message: 'Failed to load settings' });
    }
};

exports.patchPlatformSettings = async (req, res) => {
    try {
        if (!isSuper(req)) {
            return res.status(403).json({ success: false, message: 'Only superadmin can change platform flags' });
        }
        const body = req.body && typeof req.body === 'object' ? req.body : {};
        const allowedKeys = [
            'staff_readonly',
            'maintenance_banner',
            'feature_home_trending',
            'feature_home_hero',
            'low_stock_threshold',
            'order_sla_respond_hours',
            'order_sla_ship_hours',
            'anonymize_orders_after_years',
        ];
        for (const key of allowedKeys) {
            if (Object.prototype.hasOwnProperty.call(body, key)) {
                await PlatformSetting.upsert({
                    key,
                    value: body[key],
                    updated_by: req.user.id,
                });
            }
        }
        await logAdminActivity(req, {
            action: 'platform.settings.patch',
            entity_type: 'platform_settings',
            entity_id: null,
            metadata: { keys: Object.keys(body) },
        });
        return res.json({ success: true, message: 'Settings updated' });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ success: false, message: 'Failed to update settings' });
    }
};

exports.listMarketingConsents = async (req, res) => {
    try {
        if (!isFullAdmin(req)) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }
        const rows = await MarketingConsentLog.findAll({ order: [['createdAt', 'DESC']], limit: 500 });
        return res.json({ success: true, data: rows });
    } catch (e) {
        return res.status(500).json({ success: false, message: 'Failed' });
    }
};

exports.exportUserData = async (req, res) => {
    try {
        if (!isFullAdmin(req)) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }
        const id = parseInt(req.params.userId, 10);
        const user = await User.findByPk(id, {
            attributes: { exclude: ['password', 'otp'] },
        });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        const orders = await Order.findAll({
            where: { user_id: id },
            include: [{ model: OrderItem, as: 'items' }],
            limit: 2000,
        });
        await logAdminActivity(req, {
            action: 'compliance.user.export',
            entity_type: 'user',
            entity_id: id,
            metadata: {},
        });
        return res.json({
            success: true,
            data: {
                user: user.toJSON(),
                orders: orders.map((o) => o.toJSON()),
                exportedAt: new Date().toISOString(),
            },
        });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ success: false, message: 'Export failed' });
    }
};

exports.anonymizeUser = async (req, res) => {
    try {
        if (!isSuper(req)) {
            return res.status(403).json({ success: false, message: 'Only superadmin can anonymize accounts' });
        }
        const id = parseInt(req.params.userId, 10);
        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        await user.update({
            name: 'Deleted',
            lastname: 'User',
            email: `deleted_${id}_${Date.now()}@invalid.local`,
            phone_number: null,
            city: null,
        });
        await Order.update(
            {
                contact_email: `archived_${id}@invalid.local`,
                contact_phone: '0000000000',
                shipping_address: '[redacted]',
                shipping_city: '[redacted]',
                shipping_postal_code: '00000',
                shipping_country: '[redacted]',
            },
            { where: { user_id: id } }
        );
        await logAdminActivity(req, {
            action: 'compliance.user.anonymize',
            entity_type: 'user',
            entity_id: id,
            metadata: {},
        });
        return res.json({ success: true, message: 'User and related order contact fields anonymized' });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ success: false, message: 'Anonymize failed' });
    }
};

exports.runAnonymizeOldOrders = async (req, res) => {
    try {
        if (!isSuper(req)) {
            return res.status(403).json({ success: false, message: 'Only superadmin' });
        }
        const row = await PlatformSetting.findByPk('anonymize_orders_after_years');
        const years = Math.min(30, Math.max(1, parseInt(row?.value ?? 7, 10) || 7));
        const cutoff = new Date();
        cutoff.setFullYear(cutoff.getFullYear() - years);
        const oldOrders = await Order.findAll({
            where: { createdAt: { [Op.lt]: cutoff } },
            attributes: ['id'],
            limit: 500,
        });
        let n = 0;
        for (const o of oldOrders) {
            await Order.update(
                {
                    shipping_address: `[archived-${o.id}]`,
                    contact_email: 'archived@invalid.local',
                },
                { where: { id: o.id } }
            );
            n += 1;
        }
        await logAdminActivity(req, {
            action: 'compliance.orders.archive_batch',
            entity_type: 'order',
            entity_id: null,
            metadata: { years, cutoff: cutoff.toISOString(), rows: n },
        });
        return res.json({ success: true, data: { updatedRows: n, years, cutoff, cappedAt: 500 } });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ success: false, message: 'Job failed' });
    }
};

exports.listRiskFlags = async (req, res) => {
    try {
        if (!isFullAdmin(req)) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }
        const rows = await OrderRiskFlag.findAll({
            where: { status: 'open' },
            order: [['createdAt', 'DESC']],
            limit: 200,
            include: [
                {
                    model: Order,
                    as: 'orderRecord',
                    attributes: ['id', 'order_number', 'total_amount', 'status', 'contact_email'],
                },
            ],
        });
        return res.json({ success: true, data: rows });
    } catch (e) {
        return res.status(500).json({ success: false, message: 'Failed' });
    }
};

exports.patchRiskFlag = async (req, res) => {
    try {
        if (!isFullAdmin(req)) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }
        const id = parseInt(req.params.id, 10);
        const row = await OrderRiskFlag.findByPk(id);
        if (!row) return res.status(404).json({ success: false, message: 'Not found' });
        const { status, chargeback_note } = req.body || {};
        if (status) await row.update({ status });
        if (chargeback_note !== undefined) await row.update({ chargeback_note });
        await logAdminActivity(req, {
            action: 'risk.flag.patch',
            entity_type: 'order_risk_flag',
            entity_id: id,
            metadata: { status, chargeback_note },
        });
        return res.json({ success: true, data: row });
    } catch (e) {
        return res.status(500).json({ success: false, message: 'Failed' });
    }
};

exports.scanOrderRisk = async (req, res) => {
    try {
        if (!isFullAdmin(req)) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }
        const orderId = parseInt(req.params.orderId, 10);
        const order = await Order.findByPk(orderId);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
        const since = new Date(Date.now() - 24 * 3600 * 1000);
        const dupCount = await Order.count({
            where: {
                contact_email: order.contact_email,
                createdAt: { [Op.gte]: since },
                id: { [Op.ne]: order.id },
            },
        });
        const reasons = [];
        let score = 0;
        if (dupCount >= 3) {
            score += 40;
            reasons.push({ code: 'velocity_email', detail: `${dupCount} other orders same email in 24h` });
        }
        if (Number(order.total_amount) > 5000) {
            score += 20;
            reasons.push({ code: 'high_value', detail: String(order.total_amount) });
        }
        const [row] = await OrderRiskFlag.findOrCreate({
            where: { order_id: orderId, status: 'open' },
            defaults: { score, reasons },
        });
        if (!row.isNewRecord) await row.update({ score, reasons });
        await logAdminActivity(req, {
            action: 'risk.order.scan',
            entity_type: 'order',
            entity_id: orderId,
            metadata: { score, reasons },
        });
        return res.json({ success: true, data: row });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ success: false, message: 'Scan failed' });
    }
};

exports.listShipments = async (req, res) => {
    try {
        const orderId = parseInt(req.params.orderId, 10);
        const rows = await OrderShipment.findAll({ where: { order_id: orderId }, order: [['createdAt', 'DESC']] });
        return res.json({ success: true, data: rows });
    } catch (e) {
        return res.status(500).json({ success: false, message: 'Failed' });
    }
};

exports.createShipment = async (req, res) => {
    try {
        if (!isFullAdmin(req)) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }
        const orderId = parseInt(req.params.orderId, 10);
        const { tracking_number, carrier, notes, line_items } = req.body || {};
        if (!tracking_number) return res.status(400).json({ success: false, message: 'tracking_number required' });
        const row = await OrderShipment.create({
            order_id: orderId,
            tracking_number: String(tracking_number).slice(0, 160),
            carrier: carrier ? String(carrier).slice(0, 120) : null,
            notes: notes || null,
            line_items: line_items || null,
        });
        await logAdminActivity(req, {
            action: 'order.shipment.create',
            entity_type: 'order',
            entity_id: orderId,
            metadata: { shipment_id: row.id, tracking_number },
        });
        return res.json({ success: true, data: row });
    } catch (e) {
        return res.status(500).json({ success: false, message: 'Failed' });
    }
};

exports.partialShipLine = async (req, res) => {
    try {
        if (!isFullAdmin(req)) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }
        const lineId = parseInt(req.params.lineId, 10);
        const { add_qty } = req.body || {};
        const q = Math.max(0, parseInt(add_qty, 10) || 0);
        const line = await OrderItem.findByPk(lineId);
        if (!line) return res.status(404).json({ success: false, message: 'Line not found' });
        const next = Math.min(line.quantity, (line.shipped_quantity || 0) + q);
        await line.update({ shipped_quantity: next });
        await logAdminActivity(req, {
            action: 'order.line.shipped_qty',
            entity_type: 'order_item',
            entity_id: lineId,
            metadata: { shipped_quantity: next },
        });
        return res.json({ success: true, data: line });
    } catch (e) {
        return res.status(500).json({ success: false, message: 'Failed' });
    }
};

exports.listReturns = async (req, res) => {
    try {
        const rows = await ReturnRequest.findAll({ order: [['createdAt', 'DESC']], limit: 200 });
        return res.json({ success: true, data: rows });
    } catch (e) {
        return res.status(500).json({ success: false, message: 'Failed' });
    }
};

exports.createReturn = async (req, res) => {
    try {
        if (!isFullAdmin(req)) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }
        const { order_id, user_id, reason } = req.body || {};
        if (!order_id || !user_id) return res.status(400).json({ success: false, message: 'order_id and user_id required' });
        const row = await ReturnRequest.create({
            order_id,
            user_id,
            reason: reason || null,
        });
        await logAdminActivity(req, {
            action: 'return.create',
            entity_type: 'return_request',
            entity_id: row.id,
            metadata: { order_id, user_id },
        });
        return res.json({ success: true, data: row });
    } catch (e) {
        return res.status(500).json({ success: false, message: 'Failed' });
    }
};

exports.patchReturn = async (req, res) => {
    try {
        if (!isFullAdmin(req)) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }
        const id = parseInt(req.params.id, 10);
        const row = await ReturnRequest.findByPk(id);
        if (!row) return res.status(404).json({ success: false, message: 'Not found' });
        const { status, restock_fee, refund_amount, label_url, admin_notes } = req.body || {};
        const patch = {};
        if (status) patch.status = status;
        if (restock_fee !== undefined) patch.restock_fee = restock_fee;
        if (refund_amount !== undefined) patch.refund_amount = refund_amount;
        if (label_url !== undefined) patch.label_url = label_url;
        if (admin_notes !== undefined) patch.admin_notes = admin_notes;
        await row.update(patch);
        await logAdminActivity(req, {
            action: 'return.patch',
            entity_type: 'return_request',
            entity_id: id,
            metadata: patch,
        });
        return res.json({ success: true, data: row });
    } catch (e) {
        return res.status(500).json({ success: false, message: 'Failed' });
    }
};

exports.listCoupons = async (req, res) => {
    try {
        if (!isFullAdmin(req)) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }
        const rows = await Coupon.findAll({ order: [['createdAt', 'DESC']] });
        return res.json({ success: true, data: rows });
    } catch (e) {
        return res.status(500).json({ success: false, message: 'Failed' });
    }
};

exports.upsertCoupon = async (req, res) => {
    try {
        if (!isFullAdmin(req)) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }
        const payload = req.body || {};
        const id = payload.id ? parseInt(payload.id, 10) : null;
        const data = normalizeCouponBody(payload, { isUpdate: Boolean(id) });
        if (id) {
            const c = await Coupon.findByPk(id);
            if (!c) return res.status(404).json({ success: false, message: 'Not found' });
            await c.update(data);
            await c.reload();
            await logAdminActivity(req, { action: 'coupon.update', entity_type: 'coupon', entity_id: id, metadata: {} });
            return res.json({ success: true, data: c });
        }
        const c = await Coupon.create(data);
        await logAdminActivity(req, { action: 'coupon.create', entity_type: 'coupon', entity_id: c.id, metadata: {} });
        return res.json({ success: true, data: c });
    } catch (e) {
        console.error(e);
        const code = e?.parent?.code || e?.original?.code;
        if (code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, message: 'A coupon with this code already exists' });
        }
        const status = /required|Invalid|must be|cannot exceed/i.test(String(e.message)) ? 400 : 500;
        return res.status(status).json({ success: false, message: e.message });
    }
};

exports.deleteCoupon = async (req, res) => {
    try {
        if (!isFullAdmin(req)) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }
        const id = parseInt(req.params.id, 10);
        if (!id) return res.status(400).json({ success: false, message: 'Invalid id' });
        const row = await Coupon.findByPk(id);
        if (!row) return res.status(404).json({ success: false, message: 'Not found' });
        const codeSnapshot = row.code;
        await row.destroy();
        await logAdminActivity(req, {
            action: 'coupon.delete',
            entity_type: 'coupon',
            entity_id: id,
            metadata: { code: codeSnapshot },
        });
        return res.json({ success: true, message: 'Coupon deleted' });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ success: false, message: e.message });
    }
};

exports.listContentFlags = async (req, res) => {
    try {
        const status = req.query.status || 'open';
        const rows = await ContentFlag.findAll({
            where: { status },
            order: [['createdAt', 'DESC']],
            limit: 200,
        });
        return res.json({ success: true, data: rows });
    } catch (e) {
        return res.status(500).json({ success: false, message: 'Failed' });
    }
};

exports.createContentFlag = async (req, res) => {
    try {
        const { entity_type, entity_id, reason } = req.body || {};
        if (!entity_type || !entity_id) return res.status(400).json({ success: false, message: 'entity_type and entity_id required' });
        const row = await ContentFlag.create({
            entity_type: String(entity_type),
            entity_id: Number(entity_id),
            reason: reason || null,
            reporter_id: req.user.id,
        });
        return res.json({ success: true, data: row });
    } catch (e) {
        return res.status(500).json({ success: false, message: 'Failed' });
    }
};

exports.patchContentFlag = async (req, res) => {
    try {
        const r = String(req.user?.role || '').toLowerCase();
        if (!['admin', 'superadmin', 'moderator'].includes(r)) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }
        const id = parseInt(req.params.id, 10);
        const row = await ContentFlag.findByPk(id);
        if (!row) return res.status(404).json({ success: false, message: 'Not found' });
        const { status } = req.body || {};
        if (status) await row.update({ status, resolver_id: req.user.id });
        return res.json({ success: true, data: row });
    } catch (e) {
        return res.status(500).json({ success: false, message: 'Failed' });
    }
};

exports.listOrderNotes = async (req, res) => {
    try {
        const orderId = parseInt(req.params.orderId, 10);
        const rows = await AdminOrderNote.findAll({ where: { order_id: orderId }, order: [['createdAt', 'DESC']] });
        return res.json({ success: true, data: rows });
    } catch (e) {
        return res.status(500).json({ success: false, message: 'Failed' });
    }
};

exports.addOrderNote = async (req, res) => {
    try {
        const orderId = parseInt(req.params.orderId, 10);
        const { body } = req.body || {};
        if (!body || !String(body).trim()) return res.status(400).json({ success: false, message: 'body required' });
        const row = await AdminOrderNote.create({
            order_id: orderId,
            author_user_id: req.user.id,
            body: String(body).slice(0, 8000),
        });
        return res.json({ success: true, data: row });
    } catch (e) {
        return res.status(500).json({ success: false, message: 'Failed' });
    }
};

exports.listUserNotes = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId, 10);
        const rows = await AdminUserNote.findAll({ where: { target_user_id: userId }, order: [['createdAt', 'DESC']] });
        return res.json({ success: true, data: rows });
    } catch (e) {
        return res.status(500).json({ success: false, message: 'Failed' });
    }
};

exports.addUserNote = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId, 10);
        const { body } = req.body || {};
        if (!body || !String(body).trim()) return res.status(400).json({ success: false, message: 'body required' });
        const row = await AdminUserNote.create({
            target_user_id: userId,
            author_user_id: req.user.id,
            body: String(body).slice(0, 8000),
        });
        return res.json({ success: true, data: row });
    } catch (e) {
        return res.status(500).json({ success: false, message: 'Failed' });
    }
};

exports.analyticsSummary = async (req, res) => {
    try {
        const since = new Date(Date.now() - 30 * 24 * 3600 * 1000);
        const ProduktReview = require('../../model/ProduktReview');
        const [orderCount, revenueRow, pr] = await Promise.all([
            Order.count({ where: { createdAt: { [Op.gte]: since } } }),
            Order.findAll({
                where: { createdAt: { [Op.gte]: since }, payment_status: 'paid' },
                attributes: [[db.fn('SUM', db.col('total_amount')), 'sum']],
                raw: true,
            }),
            ProduktReview.count({ where: { status: 'pending' } }).catch(() => 0),
        ]);
        const revenue = Number(revenueRow?.[0]?.sum || 0);
        return res.json({
            success: true,
            data: {
                window_days: 30,
                orders_last_30d: orderCount,
                paid_revenue_last_30d: revenue,
                pending_reviews: pr,
                note: 'Funnel metrics require client tracking integration; this is server-side order/revenue only.',
            },
        });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ success: false, message: 'Failed' });
    }
};

exports.lowStockReport = async (req, res) => {
    try {
        const row = await PlatformSetting.findByPk('low_stock_threshold');
        const threshold = Math.max(0, parseInt(row?.value ?? 5, 10) || 5);
        const products = await Produkt.findAll({
            where: { product_stock: { [Op.gt]: 0, [Op.lte]: threshold } },
            attributes: ['id', 'product_name', 'product_stock', 'product_brand'],
            order: [['product_stock', 'ASC']],
            limit: 200,
        });
        return res.json({ success: true, data: { threshold, products } });
    } catch (e) {
        return res.status(500).json({ success: false, message: 'Failed' });
    }
};

exports.notifyLowStockStub = async (req, res) => {
    try {
        if (!isFullAdmin(req)) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }
        const row = await PlatformSetting.findByPk('low_stock_threshold');
        const threshold = Math.max(0, parseInt(row?.value ?? 5, 10) || 5);
        const products = await Produkt.findAll({
            where: { product_stock: { [Op.gt]: 0, [Op.lte]: threshold } },
            attributes: ['id', 'product_name', 'product_stock'],
            limit: 200,
        });
        console.info('[low-stock-email-stub] Would email ops:', products.length, 'SKUs');
        await logAdminActivity(req, {
            action: 'inventory.low_stock.notify_stub',
            entity_type: 'inventory',
            entity_id: null,
            metadata: { count: products.length },
        });
        return res.json({ success: true, message: 'Stub: logged intent to email operations (wire SMTP in production).' });
    } catch (e) {
        return res.status(500).json({ success: false, message: 'Failed' });
    }
};

exports.getCostSheet = async (req, res) => {
    try {
        const productId = parseInt(req.params.productId, 10);
        const row = await ProductCostSheet.findByPk(productId);
        return res.json({ success: true, data: row });
    } catch (e) {
        return res.status(500).json({ success: false, message: 'Failed' });
    }
};

exports.putCostSheet = async (req, res) => {
    try {
        if (!isFullAdmin(req)) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }
        const productId = parseInt(req.params.productId, 10);
        const { cost_price, supplier_po } = req.body || {};
        await ProductCostSheet.upsert({
            product_id: productId,
            cost_price: cost_price != null ? cost_price : null,
            supplier_po: supplier_po != null ? String(supplier_po).slice(0, 160) : null,
        });
        await logAdminActivity(req, {
            action: 'product.cost_sheet.upsert',
            entity_type: 'product',
            entity_id: productId,
            metadata: { cost_price, supplier_po },
        });
        const fresh = await ProductCostSheet.findByPk(productId);
        return res.json({ success: true, data: fresh });
    } catch (e) {
        return res.status(500).json({ success: false, message: 'Failed' });
    }
};

/** Admin-only: record a marketing consent event (e.g. import from another system). */
exports.recordMarketingConsent = async (req, res) => {
    try {
        if (!isFullAdmin(req)) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }
        const { channel, opted_in, metadata, user_id } = req.body || {};
        if (!channel) return res.status(400).json({ success: false, message: 'channel required' });
        await MarketingConsentLog.create({
            user_id: user_id != null ? Number(user_id) : req.user?.id || null,
            channel: String(channel).slice(0, 64),
            opted_in: Boolean(opted_in),
            ip: req.ip,
            metadata: metadata || null,
        });
        return res.json({ success: true });
    } catch (e) {
        return res.status(500).json({ success: false, message: 'Failed' });
    }
};
