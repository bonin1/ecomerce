const { QueryTypes } = require('sequelize');
const db = require('../../database');

const BUYER_ROLES = ['user', 'guest', 'banned'];

exports.listCustomers = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
        const offset = (page - 1) * limit;
        const search = (req.query.search || '').trim();

        const roleList = BUYER_ROLES.map((r) => `'${r}'`).join(',');

        let searchClause = '';
        const replacements = { limit, offset };
        if (search) {
            searchClause = `AND (u.email LIKE :search OR u.name LIKE :search OR u.lastname LIKE :search)`;
            replacements.search = `%${search}%`;
        }

        const rows = await db.query(
            `
            SELECT
                u.id,
                u.name,
                u.lastname,
                u.email,
                u.phone_number AS phoneNumber,
                u.city,
                u.role,
                u.createdAt AS joinedAt,
                COUNT(o.id) AS orderCount,
                COALESCE(SUM(o.total_amount), 0) AS lifetimeSpend
            FROM users u
            LEFT JOIN \`order\` o ON o.user_id = u.id
            WHERE u.role IN (${roleList})
            ${searchClause}
            GROUP BY u.id, u.name, u.lastname, u.email, u.phone_number, u.city, u.role, u.createdAt
            ORDER BY lifetimeSpend DESC, u.createdAt DESC
            LIMIT :limit OFFSET :offset
            `,
            { replacements, type: QueryTypes.SELECT }
        );

        let whereCount = `WHERE u.role IN (${roleList})`;
        const countRepl = {};
        if (search) {
            whereCount += ` AND (u.email LIKE :search OR u.name LIKE :search OR u.lastname LIKE :search)`;
            countRepl.search = `%${search}%`;
        }

        const [countRow] = await db.query(
            `SELECT COUNT(*) AS total FROM users u ${whereCount}`,
            { replacements: countRepl, type: QueryTypes.SELECT }
        );

        const total = countRow && countRow.total != null ? Number(countRow.total) : 0;

        return res.json({
            success: true,
            data: rows.map((r) => ({
                ...r,
                orderCount: Number(r.orderCount) || 0,
                lifetimeSpend: Number(r.lifetimeSpend) || 0,
            })),
            meta: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit) || 1,
            },
        });
    } catch (error) {
        console.error('listCustomers:', error);
        return res.status(500).json({ success: false, message: 'Failed to load customers' });
    }
};

exports.getCustomerSummary = async (req, res) => {
    try {
        const roleList = BUYER_ROLES.map((r) => `'${r}'`).join(',');

        const [agg] = await db.query(
            `
            SELECT
                COUNT(DISTINCT u.id) AS totalCustomers,
                COALESCE(SUM(o.total_amount), 0) AS totalRevenue,
                COUNT(o.id) AS totalOrders
            FROM users u
            LEFT JOIN \`order\` o ON o.user_id = u.id AND o.status <> 'cancelled'
            WHERE u.role IN (${roleList})
            `,
            { type: QueryTypes.SELECT }
        );

        const [repeaters] = await db.query(
            `
            SELECT COUNT(*) AS repeatBuyers
            FROM (
                SELECT o.user_id
                FROM \`order\` o
                INNER JOIN users u ON u.id = o.user_id AND u.role IN (${roleList})
                WHERE o.status <> 'cancelled'
                GROUP BY o.user_id
                HAVING COUNT(o.id) >= 2
            ) t
            `,
            { type: QueryTypes.SELECT }
        );

        return res.json({
            success: true,
            data: {
                totalCustomers: Number(agg?.totalCustomers) || 0,
                totalRevenue: Number(agg?.totalRevenue) || 0,
                totalOrders: Number(agg?.totalOrders) || 0,
                repeatBuyers: Number(repeaters?.repeatBuyers) || 0,
            },
        });
    } catch (error) {
        console.error('getCustomerSummary:', error);
        return res.status(500).json({ success: false, message: 'Failed to load customer summary' });
    }
};
