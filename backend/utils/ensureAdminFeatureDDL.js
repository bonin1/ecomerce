/**
 * Best-effort DDL for extended admin / ops features.
 * Ignores duplicate-column errors so boot stays idempotent.
 */
module.exports = async function ensureAdminFeatureDDL(sequelize) {
    const ignoreDup = (err) => {
        const code = err?.parent?.code || err?.original?.code;
        if (code === 'ER_DUP_FIELDNAME' || code === 'ER_DUP_KEYNAME') return;
        console.warn('[ensureAdminFeatureDDL]', err.message);
    };

    const run = async (sql) => {
        try {
            await sequelize.query(sql);
        } catch (err) {
            ignoreDup(err);
        }
    };

    await run(
        "ALTER TABLE `produkt` ADD COLUMN `listing_status` ENUM('draft','published') NOT NULL DEFAULT 'published'"
    );
    await run('ALTER TABLE `order` ADD COLUMN `respond_by` DATETIME NULL');
    await run('ALTER TABLE `order` ADD COLUMN `ship_by` DATETIME NULL');
    await run(
        'ALTER TABLE `order_item` ADD COLUMN `shipped_quantity` INT NOT NULL DEFAULT 0'
    );
    await run('ALTER TABLE `order` ADD COLUMN `coupon_code` VARCHAR(64) NULL');
    await run(
        'ALTER TABLE `order` ADD COLUMN `discount_amount` DECIMAL(10,2) NOT NULL DEFAULT 0'
    );
};
