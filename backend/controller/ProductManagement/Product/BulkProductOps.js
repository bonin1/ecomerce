const Produkt = require('../../../model/ProduktModel');
const AuditLog = require('../../../model/AuditLogModel');
const db = require('../../../database');

const MAX_IDS = 200;

/**
 * Bulk inventory: set absolute stock or add a delta (receipts / adjustments).
 * POST body: { ids: number[], set_stock?: number, add_stock?: number }
 */
const bulkInventory = async (req, res) => {
    const t = await db.transaction();
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'superadmin' && req.user.role !== 'staff') {
            await t.rollback();
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }

        const { ids, set_stock, add_stock } = req.body;

        if (!Array.isArray(ids) || ids.length === 0) {
            await t.rollback();
            return res.status(400).json({ success: false, message: 'ids must be a non-empty array' });
        }
        if (ids.length > MAX_IDS) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: `Maximum ${MAX_IDS} products per request`,
            });
        }

        const idList = ids.map((x) => parseInt(x, 10)).filter((n) => !Number.isNaN(n) && n > 0);
        if (idList.length === 0) {
            await t.rollback();
            return res.status(400).json({ success: false, message: 'No valid product ids' });
        }

        if (set_stock !== undefined && set_stock !== null && add_stock !== undefined && add_stock !== null) {
            await t.rollback();
            return res.status(400).json({ success: false, message: 'Provide only one of set_stock or add_stock' });
        }

        if (set_stock !== undefined && set_stock !== null) {
            const v = parseInt(set_stock, 10);
            if (Number.isNaN(v) || v < 0) {
                await t.rollback();
                return res.status(400).json({ success: false, message: 'set_stock must be a non-negative integer' });
            }
            await Produkt.update({ product_stock: v }, { where: { id: idList }, transaction: t });
        } else if (add_stock !== undefined && add_stock !== null) {
            const delta = parseInt(add_stock, 10);
            if (Number.isNaN(delta)) {
                await t.rollback();
                return res.status(400).json({ success: false, message: 'add_stock must be an integer' });
            }
            const rows = await Produkt.findAll({ where: { id: idList }, transaction: t });
            for (const row of rows) {
                const next = Math.max(0, Number(row.product_stock) + delta);
                await row.update({ product_stock: next }, { transaction: t });
            }
        } else {
            await t.rollback();
            return res.status(400).json({ success: false, message: 'set_stock or add_stock is required' });
        }

        await AuditLog.create(
            {
                user_id: req.user.id,
                action: 'BULK_INVENTORY',
                entity_type: 'PRODUCT',
                entity_id: 0,
                new_values: { ids: idList, set_stock, add_stock },
                status: 'approved',
            },
            { transaction: t }
        );

        await t.commit();
        return res.status(200).json({
            success: true,
            message: 'Inventory updated',
            data: { updated: idList.length },
        });
    } catch (error) {
        await t.rollback();
        console.error('bulkInventory error:', error);
        return res.status(500).json({
            success: false,
            message: 'Bulk inventory update failed',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
};

module.exports = { bulkInventory };
