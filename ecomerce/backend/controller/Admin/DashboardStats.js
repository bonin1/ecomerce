const User = require('../../model/UserModel');
const Produkt = require('../../model/ProduktModel');
const ProductCategory = require('../../model/ProductCategoryModel');
const { Op, Sequelize } = require('sequelize');
const { subDays, format } = require('date-fns');

exports.getDashboardStats = async (req, res) => {
    try {
        const now = new Date();
        const thirtyDaysAgo = subDays(now, 30);
        
        const dailyUsers = await User.findAll({
            where: {
                createdAt: {
                    [Op.gte]: thirtyDaysAgo,
                    [Op.lte]: now
                }
            },
            attributes: [
                [Sequelize.fn('DATE_FORMAT', Sequelize.col('createdAt'), '%Y-%m-%d'), 'date'],
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
            ],
            group: [Sequelize.fn('DATE_FORMAT', Sequelize.col('createdAt'), '%Y-%m-%d')],
            raw: true
        });

        const dailyProducts = await Produkt.findAll({
            where: {
                createdAt: {
                    [Op.gte]: thirtyDaysAgo,
                    [Op.lte]: now
                }
            },
            attributes: [
                [Sequelize.fn('DATE_FORMAT', Sequelize.col('createdAt'), '%Y-%m-%d'), 'date'],
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
            ],
            group: [Sequelize.fn('DATE_FORMAT', Sequelize.col('createdAt'), '%Y-%m-%d')],
            raw: true
        });

        const [totalUsers, totalProducts, totalCategories] = await Promise.all([
            User.count(),
            Produkt.count(),
            ProductCategory.count()
        ]);

        const timeSeriesData = [];
        for (let i = 0; i < 30; i++) {
            const date = format(subDays(now, i), 'yyyy-MM-dd');
            const userCount = dailyUsers.find(d => d.date === date)?.count || 0;
            const productCount = dailyProducts.find(d => d.date === date)?.count || 0;
            
            timeSeriesData.unshift({
                date,
                users: parseInt(userCount),
                products: parseInt(productCount)
            });
        }

        const userGrowth = calculateGrowthRate(timeSeriesData.map(d => d.users));
        const productGrowth = calculateGrowthRate(timeSeriesData.map(d => d.products));

        res.json({
            success: true,
            data: {
                totalUsers,
                totalProducts,
                totalCategories,
                timeSeriesData,
                growth: {
                    users: userGrowth,
                    products: productGrowth
                }
            }
        });
    } catch (error) {
        console.error('Dashboard Stats Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching dashboard statistics',
            error: error.message
        });
    }
};

function calculateGrowthRate(data) {
    const current = data.slice(-7).reduce((sum, val) => sum + val, 0);
    const previous = data.slice(-14, -7).reduce((sum, val) => sum + val, 0);
    return previous === 0 ? 0 : ((current - previous) / previous) * 100;
}
