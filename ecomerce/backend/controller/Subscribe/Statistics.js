const Subscribe = require("../../model/SubscribeModel");
const { Op } = require("sequelize");
const sequelize = require("../../database");

exports.getOverallStats = async (req, res) => {
    try {
        const totalSubscribers = await Subscribe.count();

        const activeSubscribers = await Subscribe.count({
            where: { isActive: true },
        });

        const inactiveSubscribers = await Subscribe.count({
            where: { isActive: false },
        });

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const newSubscribers = await Subscribe.count({
            where: {
                createdAt: { [Op.gte]: thirtyDaysAgo },
            },
        });

        const recentUnsubscribes = await Subscribe.count({
            where: {
                unsubscribedAt: {
                    [Op.gte]: thirtyDaysAgo,
                    [Op.ne]: null,
                },
            },
        });

        return res.status(200).json({
            success: true,
            data: {
                totalSubscribers,
                activeSubscribers,
                inactiveSubscribers,
                newSubscribers,
                recentUnsubscribes,
                retentionRate:
                totalSubscribers > 0
                    ? ((activeSubscribers / totalSubscribers) * 100).toFixed(2) + "%"
                    : "0%",
            },
        });
    } catch (error) {
        console.error("Error getting subscription statistics:", error);
        return res
        .status(500)
        .json({
            success: false,
            message: "Failed to fetch subscription statistics",
        });
    }
};

exports.getMonthlyTrends = async (req, res) => {
    try {
        const lastYear = new Date();
        lastYear.setFullYear(lastYear.getFullYear() - 1);

        const monthlySubscriptions = await Subscribe.findAll({
            attributes: [
                [
                    sequelize.fn("DATE_FORMAT", sequelize.col("createdAt"), "%Y-%m"),
                    "month",
                ],
                [sequelize.fn("COUNT", sequelize.col("id")), "count"],
            ],
            where: {
                createdAt: { [Op.gte]: lastYear },
            },
            group: [sequelize.fn("DATE_FORMAT", sequelize.col("createdAt"), "%Y-%m")],
            order: [
                [
                    sequelize.fn("DATE_FORMAT", sequelize.col("createdAt"), "%Y-%m"),
                    "ASC",
                ],
            ],
        });

        const monthlyUnsubscriptions = await Subscribe.findAll({
        attributes: [
            [
                sequelize.fn("DATE_FORMAT", sequelize.col("unsubscribedAt"), "%Y-%m"),
                "month",
            ],
            [sequelize.fn("COUNT", sequelize.col("id")), "count"],
        ],
        where: {
            unsubscribedAt: {
            [Op.gte]: lastYear,
            [Op.ne]: null,
            },
        },
        group: [
            sequelize.fn("DATE_FORMAT", sequelize.col("unsubscribedAt"), "%Y-%m"),
        ],
        order: [
            [
                sequelize.fn("DATE_FORMAT", sequelize.col("unsubscribedAt"), "%Y-%m"),
                "ASC",
            ],
        ],
        });

        return res.status(200).json({
            success: true,
            data: {
                subscriptions: monthlySubscriptions,
                unsubscriptions: monthlyUnsubscriptions,
            },
        });
    } catch (error) {
        console.error("Error getting monthly subscription trends:", error);
        return res
        .status(500)
        .json({
            success: false,
            message: "Failed to fetch monthly subscription trends",
        });
    }
};
