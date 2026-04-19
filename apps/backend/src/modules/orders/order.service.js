import { prisma } from '../../config/Postgrsedb.js';
import { ApiError } from '../../utils/ApiError.js';
import { getFirstImage } from '../../utils/safeJsonParse.js';

const VALID_STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

// Safe money rounding to 2 decimal places — avoids JS floating-point drift
const roundMoney = (amount) => Math.round(amount * 100) / 100;


export const createOrder = async (userId, { items, totalAmount, shippingAddress, paymentMethod, couponCode }) => {
        if (!items || items.length === 0) throw new ApiError(400, 'No items in order');

        const addr = shippingAddress;
        if (!addr?.name || !addr?.phone || !addr?.street || !addr?.city || !addr?.state || !addr?.pincode) {
            throw new ApiError(400, 'Complete shipping address is required (name, phone, street, city, state, pincode)');
        }

        // Use transaction with row locking to prevent race conditions
        return await prisma.$transaction(async (tx) => {
            // Work in paise (integer) to avoid floating-point precision issues
            let subtotalPaise = 0;
            const orderItems = [];

            // Lock products for update to prevent concurrent stock modifications
            for (const item of items) {
                // FIX: table name is 'products' (@@map), IDs are CUIDs (not UUIDs)
                const rows = await tx.$queryRaw`
                    SELECT id, name, price, stock, "isActive", images FROM products WHERE id = ${item.product} FOR UPDATE
                `;
                const product = rows[0];

                if (!product) throw new ApiError(404, `Product ${item.product} not found`);
                if (!product.isActive) throw new ApiError(400, `Product "${product.name}" is not available`);

                if (item.variantId) {
                    // Variant-aware path: lock the weight_variants row
                    const variantRows = await tx.$queryRaw`
                        SELECT id, "weightLabel", price, stock FROM weight_variants WHERE id = ${item.variantId} FOR UPDATE
                    `;
                    const variant = variantRows[0];
                    if (!variant) throw new ApiError(404, `Variant ${item.variantId} not found`);
                    if (item.quantity > variant.stock) {
                        throw new ApiError(400, `Insufficient stock for variant "${variant.weightLabel}". Available: ${variant.stock}`);
                    }

                    // Use variant price for subtotal
                    subtotalPaise += Math.round(Number(variant.price) * 100) * item.quantity;
                    const imgVariant = getFirstImage(product.images);
                    orderItems.push({
                        productId: product.id,
                        name: product.name,
                        price: variant.price,
                        quantity: item.quantity,
                        image: imgVariant?.url ?? imgVariant ?? null,
                        weightLabel: variant.weightLabel,
                        variantId: item.variantId
                    });
                } else {
                    // Legacy path: use product stock and price
                    if (item.quantity > product.stock) {
                        throw new ApiError(400, `Insufficient stock for "${product.name}". Available: ${product.stock}`);
                    }

                    // Accumulate in paise to avoid float drift
                    subtotalPaise += Math.round(Number(product.price) * 100) * item.quantity;
                    const imgLegacy = getFirstImage(product.images);
                    orderItems.push({
                        productId: product.id,
                        name: product.name,
                        price: product.price,
                        quantity: item.quantity,
                        image: imgLegacy?.url ?? imgLegacy ?? null,
                    });
                }
            }

            // Convert back to rupees with safe rounding
            const calculatedSubtotal = roundMoney(subtotalPaise / 100);
            const deliveryCharge = calculatedSubtotal >= 500 ? 0 : 40;

            let discount = 0;
            let couponId = null;
            if (couponCode) {
                // FIX: table name is 'coupons' (@@map), IDs are CUIDs (not UUIDs)
                const couponRows = await tx.$queryRaw`
                    SELECT * FROM coupons WHERE code = ${couponCode.toUpperCase()} FOR UPDATE
                `;
                const coupon = couponRows[0];

                if (coupon && coupon.isActive && new Date(coupon.validUntil) >= new Date()) {
                    // Check usage limit atomically
                    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
                        throw new ApiError(400, 'Coupon usage limit reached');
                    }

                    if (calculatedSubtotal >= Number(coupon.minOrderAmount || 0)) {
                        if (coupon.discountType === 'FLAT') {
                            discount = roundMoney(Number(coupon.discountValue));
                        } else {
                            const raw = (calculatedSubtotal * Number(coupon.discountValue)) / 100;
                            const cap = coupon.maxDiscount ? Number(coupon.maxDiscount) : Infinity;
                            discount = roundMoney(Math.min(raw, cap));
                        }

                        couponId = coupon.id;
                        // Update coupon usage count atomically
                        await tx.coupon.update({
                            where: { id: coupon.id },
                            data: { usedCount: { increment: 1 } }
                        });
                    }
                }
            }

            const calculatedTotal = roundMoney(Math.max(0, calculatedSubtotal + deliveryCharge - discount));

            // Always recalculate on backend - never trust frontend prices
            if (typeof totalAmount === 'number' && Math.abs(totalAmount - calculatedTotal) > 1) {
                throw new ApiError(400, 'Order total mismatch', [
                    `Expected: ₹${calculatedTotal}`,
                    `Received: ₹${totalAmount}`,
                    `Subtotal: ₹${calculatedSubtotal}, Delivery: ₹${deliveryCharge}, Discount: ₹${discount}`,
                ]);
            }

            // Create order and update stock atomically
            const order = await tx.order.create({
                data: {
                    userId,
                    subtotal: calculatedSubtotal,
                    discount,
                    couponCode: couponCode?.toUpperCase() || null,
                    totalAmount: calculatedTotal,
                    shippingName: addr.name,
                    shippingPhone: addr.phone,
                    shippingStreet: addr.street,
                    shippingCity: addr.city,
                    shippingState: addr.state,
                    shippingPincode: addr.pincode,
                    paymentMethod: paymentMethod?.toUpperCase() || 'COD',
                    items: {
                        create: orderItems
                    },
                    statusHistory: {
                        create: {
                            status: 'PENDING',
                            changedBy: userId
                        }
                    }
                },
                include: {
                    items: true,
                    user: {
                        select: { id: true, name: true, email: true }
                    }
                }
            });

            // Update stock atomically in same transaction
            await Promise.all(
                items.map(item => {
                    if (item.variantId) {
                        // Variant path: decrement variant stock, increment product totalSold
                        return Promise.all([
                            tx.$executeRaw`
                                UPDATE weight_variants SET stock = stock - ${item.quantity} WHERE id = ${item.variantId}
                            `,
                            tx.product.update({
                                where: { id: item.product },
                                data: { totalSold: { increment: item.quantity } }
                            })
                        ]);
                    } else {
                        // Legacy path: decrement product stock and increment totalSold
                        return tx.product.update({
                            where: { id: item.product },
                            data: {
                                stock: { decrement: item.quantity },
                                totalSold: { increment: item.quantity }
                            }
                        });
                    }
                })
            );

            // TODO: [BULLMQ] Queue order processing/notification job
            // e.g., await orderQueue.add('process-new-order', { orderId: order.id, userId });
            return order;
        }, {
            maxWait: 5000, // Maximum time to wait for transaction to start
            timeout: 10000, // Maximum time for transaction to complete
            isolationLevel: 'Serializable' // Highest isolation level
        });
    }

export const getOrders = async (user, filters) => {
        const where = {};

        if (user.role?.toUpperCase() === 'USER') {
            where.userId = user.id;
        } else {
            if (filters.status) {
                const statusUpper = filters.status.toUpperCase();
                if (!VALID_STATUSES.includes(statusUpper)) {
                    throw new ApiError(400, 'Invalid status filter');
                }
                where.status = statusUpper;
            }
        }

        const toNum = (d) => (d ? Number(d.toString()) : 0);
        const orders = await prisma.order.findMany({
            where,
            include: {
                user: { select: { name: true, email: true } },
                items: true
            },
            orderBy: { createdAt: 'desc' }
        });
        return orders.map(o => ({
            ...o,
            subtotal: toNum(o.subtotal),
            totalAmount: toNum(o.totalAmount),
            discount: toNum(o.discount),
            refundAmount: toNum(o.refundAmount),
        }));
    }

export const getOrder = async (orderId, user) => {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                user: { select: { id: true, name: true, email: true } },
                items: { include: { product: true } }
            }
        });

        if (!order) throw new ApiError(404, 'Order not found');

        if (user.role?.toUpperCase() === 'USER' && order.userId !== user.id) {
            throw new ApiError(403, 'Not authorized to view this order');
        }

        return order;
    }

export const updateOrderStatus = async (orderId, status, changedBy) => {
        const statusUpper = status.toUpperCase();
        if (!VALID_STATUSES.includes(statusUpper)) {
            throw new ApiError(400, `Invalid status. Must be: ${VALID_STATUSES.join(', ')}`);
        }

        const order = await prisma.order.findUnique({
            where: { id: orderId }
        });

        if (!order) throw new ApiError(404, 'Order not found');

        return prisma.order.update({
            where: { id: orderId },
            data: {
                status: statusUpper,
                statusHistory: {
                    create: {
                        status: statusUpper,
                        changedBy
                    }
                }
            },
            include: {
                items: true,
                user: { select: { name: true, email: true } }
            }
        });
    }

export const getOrderStats = async () => {
        const [
            totalOrders,
            pendingOrders,
            deliveredOrders,
            revenueAgg,
            refundRequests,
            cancelledOrders,
            recentOrdersRaw,
            locationGroups
        ] = await Promise.all([
            prisma.order.count(),
            prisma.order.count({ where: { status: 'PENDING' } }),
            prisma.order.count({ where: { status: 'DELIVERED' } }),
            prisma.order.aggregate({
                _sum: { totalAmount: true }
            }),
            prisma.order.count({ where: { refundStatus: { not: 'NONE' } } }),
            prisma.order.count({ where: { status: 'CANCELLED' } }),
            prisma.order.findMany({
                include: { user: { select: { name: true, email: true } } },
                orderBy: { createdAt: 'desc' },
                take: 5
            }),
            // Sales by location — group by city + state
            prisma.order.groupBy({
                by: ['shippingCity', 'shippingState'],
                _count: { id: true },
                _sum: { totalAmount: true },
                orderBy: { _count: { id: 'desc' } },
                take: 10
            })
        ]);

        // Handle Decimal type - convert to number safely
        const totalRevenue = revenueAgg._sum.totalAmount
            ? Number(revenueAgg._sum.totalAmount.toString())
            : 0;

        // Convert Decimal fields in recentOrders to numbers for JSON serialization
        const toNum = (d) => (d ? Number(d.toString()) : 0);
        const recentOrders = recentOrdersRaw.map(order => ({
            ...order,
            subtotal: toNum(order.subtotal),
            totalAmount: toNum(order.totalAmount),
            discount: toNum(order.discount),
            refundAmount: toNum(order.refundAmount),
        }));

        // Format location stats
        const locationStats = locationGroups
            .filter(g => g.shippingCity) // skip orders with no city
            .map(g => ({
                city: g.shippingCity,
                state: g.shippingState || '',
                count: g._count.id,
                revenue: toNum(g._sum.totalAmount)
            }));

        return {
            totalOrders,
            pendingOrders,
            deliveredOrders,
            totalRevenue,
            totalProfit: totalRevenue * 0.2,
            refundRequests,
            cancelledOrders,
            recentOrders,
            locationStats
        };
    }

export const processRefund = async (orderId, { refundStatus, refundReason, refundAmount }, adminId) => {
        const order = await prisma.order.findUnique({
            where: { id: orderId }
        });

        if (!order) throw new ApiError(404, 'Order not found');

        if (refundAmount && refundAmount > Number(order.totalAmount)) {
            throw new ApiError(400, 'Refund amount cannot exceed order total');
        }

        const updateData = {
            refundStatus: refundStatus.toUpperCase()
        };

        if (refundReason) updateData.refundReason = refundReason;
        if (refundAmount) updateData.refundAmount = refundAmount;
        if (refundStatus.toUpperCase() === 'COMPLETED') updateData.refundedAt = new Date();

        if (['APPROVED', 'COMPLETED'].includes(refundStatus.toUpperCase()) && order.status !== 'CANCELLED') {
            updateData.status = 'CANCELLED';
        }

        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: updateData
        });

        if (['APPROVED', 'COMPLETED'].includes(refundStatus.toUpperCase())) {
            await prisma.orderStatusHistory.create({
                data: {
                    orderId,
                    status: 'CANCELLED',
                    changedBy: adminId
                }
            });
        }

        return updatedOrder;
    }

export const updateTracking = async (orderId, { trackingNumber, trackingUrl, carrier }) => {
        const updateData = {};
        if (trackingNumber) updateData.trackingNumber = trackingNumber;
        if (trackingUrl) updateData.trackingUrl = trackingUrl;
        if (carrier) updateData.carrier = carrier;

        return prisma.order.update({
            where: { id: orderId },
            data: updateData
        }).catch(() => {
            throw new ApiError(404, 'Order not found');
        });
    }

export const requestReturn = async (orderId, refundReason, user) => {
        const order = await prisma.order.findUnique({
            where: { id: orderId }
        });

        if (!order) throw new ApiError(404, 'Order not found');

        if (user.role?.toUpperCase() === 'USER' && order.userId !== user.id) {
            throw new ApiError(403, 'Not authorized');
        }

        if (order.status !== 'DELIVERED') {
            throw new ApiError(400, 'Only delivered orders can be returned');
        }

        if (order.refundStatus !== 'NONE') {
            throw new ApiError(400, 'Return already requested for this order');
        }

        return prisma.order.update({
            where: { id: orderId },
            data: {
                refundStatus: 'REQUESTED',
                refundReason: refundReason || null
            }
        });
};
