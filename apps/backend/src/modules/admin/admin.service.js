import Order from '../orders/order.model.js';
import Product from '../products/product.model.js';
import User from '../users/user.model.js';

class AdminService {
    static async getConversionRate() {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const [totalUsers, usersWithOrders, monthlyOrders] = await Promise.all([
            User.countDocuments({ role: 'user' }),
            Order.distinct('user'),
            Order.aggregate([
                { $match: { createdAt: { $gte: sixMonthsAgo } } },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
                        orders: { $sum: 1 },
                        revenue: { $sum: '$totalAmount' },
                    },
                },
                { $sort: { _id: 1 } },
            ]),
        ]);

        const conversionRate = totalUsers > 0
            ? parseFloat(((usersWithOrders.length / totalUsers) * 100).toFixed(1))
            : 0;

        return { conversionRate, totalUsers, usersWithOrders: usersWithOrders.length, monthlyOrders };
    }

    static async getLowStockAlerts() {
        const products = await Product.find({
            $expr: { $lte: ['$stock', '$lowStockThreshold'] },
            isActive: true,
        }).populate('category', 'name').sort({ stock: 1 });

        return {
            count: products.length,
            products: products.map(p => ({
                _id: p._id,
                name: p.name,
                stock: p.stock,
                threshold: p.lowStockThreshold,
                category: p.category?.name,
                price: p.price,
            })),
        };
    }

    static async getRefundStats() {
        const [refundAgg, cancelledOrders, totalOrders, recentRefunds] = await Promise.all([
            Order.aggregate([
                { $match: { refundStatus: { $ne: 'none' } } },
                { $group: { _id: '$refundStatus', count: { $sum: 1 }, totalAmount: { $sum: '$refundAmount' } } },
            ]),
            Order.countDocuments({ status: 'cancelled' }),
            Order.countDocuments(),
            Order.find({ refundStatus: { $ne: 'none' } })
                .populate('user', 'name email')
                .sort({ updatedAt: -1 })
                .limit(10),
        ]);

        return {
            refundsByStatus: refundAgg,
            cancelledOrders,
            returnRate: totalOrders > 0 ? parseFloat(((cancelledOrders / totalOrders) * 100).toFixed(1)) : 0,
            totalOrders,
            recentRefunds,
        };
    }
}

export default AdminService;
