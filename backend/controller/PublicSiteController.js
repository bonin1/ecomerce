const { Op } = require('sequelize');
const PlatformSetting = require('../model/PlatformSettingModel');

exports.getPublicSiteConfig = async (req, res) => {
    try {
        const keys = ['maintenance_banner', 'feature_home_trending', 'feature_home_hero', 'staff_readonly'];
        const rows = await PlatformSetting.findAll({
            where: { key: { [Op.in]: keys } },
        });
        const map = {};
        for (const r of rows) map[r.key] = r.value;
        return res.json({
            success: true,
            data: {
                maintenance_banner: map.maintenance_banner || '',
                feature_home_trending: map.feature_home_trending !== false,
                feature_home_hero: map.feature_home_hero !== false,
                staff_readonly: map.staff_readonly === true || map.staff_readonly?.enabled === true,
            },
        });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ success: false, message: 'Config unavailable' });
    }
};
