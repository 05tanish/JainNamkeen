import { prisma } from '../../config/Postgrsedb.js';
import { isRedisConnected, getRedisClient } from '../../config/Redis.js';
import { isMongoConnected } from '../../config/mongodb.js';
import { healthCheck } from '../../middleware/metrics.js';
import mongoose from 'mongoose';
import os from 'os';

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
        // Handle Decimal type - convert to number safely
        const amount = order.totalAmount ? Number(order.totalAmount.toString()) : 0;
        acc[month].revenue += amount;
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
            isActive: true
        },
        include: {
            category: { select: { name: true } }
        },
        orderBy: { stock: 'asc' }
    });

    // Filter products where stock is less than or equal to their threshold
    const lowStockProducts = products.filter(p => p.stock <= p.lowStockThreshold);

    return {
        count: lowStockProducts.length,
        products: lowStockProducts.map(p => ({
            _id: p.id,
            name: p.name,
            stock: p.stock,
            threshold: p.lowStockThreshold,
            category: p.category?.name,
            // Handle Decimal type - convert to number safely
            price: p.price ? Number(p.price.toString()) : 0
        }))
    };
};

export const getRefundStats = async () => {
    const [refundOrders, cancelledOrders, totalOrders, recentRefundsRaw] = await Promise.all([
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
        // Handle Decimal type - convert to number safely
        const refundAmount = order.refundAmount ? Number(order.refundAmount.toString()) : 0;
        acc[status].totalAmount += refundAmount;
        return acc;
    }, {});

    const toNum = (d) => (d ? Number(d.toString()) : 0);

    // Convert Decimal fields in recentRefunds to numbers for JSON serialization
    const recentRefunds = recentRefundsRaw.map(order => ({
        ...order,
        subtotal: toNum(order.subtotal),
        totalAmount: toNum(order.totalAmount),
        discount: toNum(order.discount),
        refundAmount: toNum(order.refundAmount),
    }));

    return {
        refundsByStatus: Object.values(refundsByStatus),
        cancelledOrders,
        returnRate: totalOrders > 0 ? parseFloat(((cancelledOrders / totalOrders) * 100).toFixed(1)) : 0,
        totalOrders,
        recentRefunds
    };
};


export const getSystemStatus = async () => {
    const startTime = process.hrtime.bigint();

    // ── PostgreSQL ────────────────────────────────────────────────────────────
    let postgresStatus = { connected: false, latencyMs: null, error: null };
    try {
        const t0 = Date.now();
        await prisma.$queryRaw`SELECT 1`;
        postgresStatus = { connected: true, latencyMs: Date.now() - t0, error: null };
        healthCheck.labels('database').set(1);
    } catch (err) {
        postgresStatus.error = err.message;
        healthCheck.labels('database').set(0);
    }

    // ── MongoDB ───────────────────────────────────────────────────────────────
    const mongoReadyState = mongoose.connection.readyState;
    // readyState: 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
    const mongoStateMap = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
    let mongoStatus = {
        connected: mongoReadyState === 1,
        state: mongoStateMap[mongoReadyState] ?? 'unknown',
        latencyMs: null,
        error: null,
    };
    if (mongoReadyState === 1) {
        try {
            const t0 = Date.now();
            await mongoose.connection.db.admin().ping();
            mongoStatus.latencyMs = Date.now() - t0;
            healthCheck.labels('mongo').set(1);
        } catch (err) {
            mongoStatus.error = err.message;
            healthCheck.labels('mongo').set(0);
        }
    } else {
        healthCheck.labels('mongo').set(0);
    }

    // ── Redis ─────────────────────────────────────────────────────────────────
    const redisUp = isRedisConnected();
    let redisStatus = { connected: redisUp, latencyMs: null, error: null };
    if (redisUp) {
        try {
            const client = getRedisClient();
            const t0 = Date.now();
            await client.ping();
            redisStatus.latencyMs = Date.now() - t0;
            healthCheck.labels('redis').set(1);
        } catch (err) {
            redisStatus.connected = false;
            redisStatus.error = err.message;
            healthCheck.labels('redis').set(0);
        }
    } else {
        healthCheck.labels('redis').set(0);
    }

    // ── Process / System ─────────────────────────────────────────────────────
    const memUsage = process.memoryUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const uptimeSeconds = Math.floor(process.uptime());

    healthCheck.labels('app').set(1);

    return {
        timestamp: new Date().toISOString(),
        uptime: uptimeSeconds,
        services: {
            postgres: postgresStatus,
            mongodb: mongoStatus,
            redis: redisStatus,
        },
        process: {
            heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024),
            heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024),
            rssMemMB: Math.round(memUsage.rss / 1024 / 1024),
            externalMB: Math.round(memUsage.external / 1024 / 1024),
        },
        system: {
            freeMemMB: Math.round(freeMem / 1024 / 1024),
            totalMemMB: Math.round(totalMem / 1024 / 1024),
            memUsedPct: Math.round(((totalMem - freeMem) / totalMem) * 100),
            cpuCount: os.cpus().length,
            platform: os.platform(),
            nodeVersion: process.version,
        },
    };
};
