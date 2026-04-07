import Order from '../orders/order.model.js';
import Product from '../products/product.model.js';
import User from '../users/user.model.js';

// GET /api/admin/conversion-rate
export const getConversionRate = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({ role: 'user' });
        const usersWithOrders = await Order.distinct('user');
        const conversionRate = totalUsers > 0
            ? ((usersWithOrders.length / totalUsers) * 100).toFixed(1)
            : 0;

        // Monthly breakdown (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthlyOrders = await Order.aggregate([
            { $match: { createdAt: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
                    orders: { $sum: 1 },
                    revenue: { $sum: '$totalAmount' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json({
            conversionRate: parseFloat(conversionRate),
            totalUsers,
            usersWithOrders: usersWithOrders.length,
            monthlyOrders
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/admin/low-stock
export const getLowStockAlerts = async (req, res) => {
    try {
        const products = await Product.find({
            $expr: { $lte: ['$stock', '$lowStockThreshold'] },
            isActive: true
        }).populate('category', 'name').sort({ stock: 1 });

        res.json({
            count: products.length,
            products: products.map(p => ({
                _id: p._id,
                name: p.name,
                stock: p.stock,
                threshold: p.lowStockThreshold,
                category: p.category?.name,
                price: p.price
            }))
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/admin/refund-stats
export const getRefundStats = async (req, res) => {
    try {
        const refundAgg = await Order.aggregate([
            { $match: { refundStatus: { $ne: 'none' } } },
            {
                $group: {
                    _id: '$refundStatus',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$refundAmount' }
                }
            }
        ]);

        const cancelledOrders = await Order.countDocuments({ status: 'cancelled' });
        const totalOrders = await Order.countDocuments();
        const returnRate = totalOrders > 0
            ? ((cancelledOrders / totalOrders) * 100).toFixed(1)
            : 0;

        const recentRefunds = await Order.find({ refundStatus: { $ne: 'none' } })
            .populate('user', 'name email')
            .sort({ updatedAt: -1 })
            .limit(10);

        res.json({
            refundsByStatus: refundAgg,
            cancelledOrders,
            returnRate: parseFloat(returnRate),
            totalOrders,
            recentRefunds
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
