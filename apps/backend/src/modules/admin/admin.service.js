import { prisma } from '../../config/Postgrsedb.js';

export const getConversionRate = async () => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const [totalUsers, usersWithOrders, orders] = await Promise.all([
        prisma.user.count({ where: { role: 'USER' } }),
        prisma.order.findMany({
            select: { userId: true },
            distinct: ['userId']
        }),
        prisma.order.findMany({
            where: { createdAt: { gte: sixMonthsAgo } },
            select: {
                createdAt: true,
                totalAmount: true
            }
        })
    ]);

    const monthlyOrders = orders.reduce((acc, order) => {
        const month = order.createdAt.toISOString().substring(0, 7);
        if (!acc[month]) {
            acc[month] = { _id: month, orders: 0, revenue: 0 };
        }
        acc[month].orders += 1;
        acc[month].revenue += Number(order.totalAmount);
        return acc;
    }, {});

    const monthlyOrdersArray = Object.values(monthlyOrders).sort((a, b) => a._id.localeCompare(b._id));

    const conversionRate = totalUsers > 0
        ? parseFloat(((usersWithOrders.length / totalUsers) * 100).toFixed(1))
        : 0;

    return {
        conversionRate,
        totalUsers,
        usersWithOrders: usersWithOrders.length,
        monthlyOrders: monthlyOrdersArray
    };
};

export const getLowStockAlerts = async () => {
    const products = await prisma.product.findMany({
        where: {
            isActive: true,
            stock: { lte: prisma.product.fields.lowStockThreshold }
        },
        include: {
            category: { select: { name: true } }
        },
        orderBy: { stock: 'asc' }
    });

    return {
        count: products.length,
        products: products.map(p => ({
            _id: p.id,
            name: p.name,
            stock: p.stock,
            threshold: p.lowStockThreshold,
            category: p.category?.name,
            price: p.price
        }))
    };
};

export const getRefundStats = async () => {
    const [refundOrders, cancelledOrders, totalOrders, recentRefunds] = await Promise.all([
        prisma.order.findMany({
            where: { refundStatus: { not: 'NONE' } },
            select: { refundStatus: true, refundAmount: true }
        }),
        prisma.order.count({ where: { status: 'CANCELLED' } }),
        prisma.order.count(),
        prisma.order.findMany({
            where: { refundStatus: { not: 'NONE' } },
            include: {
                user: { select: { name: true, email: true } }
            },
            orderBy: { updatedAt: 'desc' },
            take: 10
        })
    ]);

    const refundsByStatus = refundOrders.reduce((acc, order) => {
        const status = order.refundStatus;
        if (!acc[status]) {
            acc[status] = { _id: status, count: 0, totalAmount: 0 };
        }
        acc[status].count += 1;
        acc[status].totalAmount += Number(order.refundAmount || 0);
        return acc;
    }, {});

    return {
        refundsByStatus: Object.values(refundsByStatus),
        cancelledOrders,
        returnRate: totalOrders > 0 ? parseFloat(((cancelledOrders / totalOrders) * 100).toFixed(1)) : 0,
        totalOrders,
        recentRefunds
    };
};
