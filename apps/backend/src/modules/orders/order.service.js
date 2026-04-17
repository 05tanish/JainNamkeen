import { prisma } from '../../config/Postgrsedb.js';
import { ApiError } from '../../utils/ApiError.js';

const VALID_STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

class OrderService {
    static async createOrder(userId, { items, totalAmount, shippingAddress, paymentMethod, couponCode }) {
        if (!items || items.length === 0) throw new ApiError(400, 'No items in order');

        const addr = shippingAddress;
        if (!addr?.name || !addr?.phone || !addr?.street || !addr?.city || !addr?.state || !addr?.pincode) {
            throw new ApiError(400, 'Complete shipping address is required (name, phone, street, city, state, pincode)');
        }

        let calculatedSubtotal = 0;
        const orderItems = [];

        for (const item of items) {
            const product = await prisma.product.findUnique({
                where: { id: item.product }
            });

            if (!product) throw new ApiError(404, `Product ${item.product} not found`);
            if (!product.isActive) throw new ApiError(400, `Product "${product.name}" is not available`);
            if (item.quantity > product.stock) {
                throw new ApiError(400, `Insufficient stock for "${product.name}". Available: ${product.stock}`);
            }

            calculatedSubtotal += Number(product.price) * item.quantity;
            orderItems.push({
                productId: product.id,
                name: product.name,
                price: product.price,
                quantity: item.quantity,
                image: Array.isArray(product.images) && product.images.length > 0 
                    ? (typeof product.images[0] === 'string' ? product.images[0] : product.images[0]?.url)
                    : null
            });
        }

        const deliveryCharge = calculatedSubtotal >= 500 ? 0 : 40;

        let discount = 0;
        if (couponCode) {
            const coupon = await prisma.coupon.findUnique({
                where: {
                    code: couponCode.toUpperCase()
                }
            });

            if (coupon && coupon.isActive && new Date(coupon.validUntil) >= new Date()) {
                if (calculatedSubtotal >= Number(coupon.minOrderAmount || 0)) {
                    discount = coupon.discountType === 'FLAT'
                        ? Number(coupon.discountValue)
                        : Math.min(
                            (calculatedSubtotal * Number(coupon.discountValue)) / 100,
                            coupon.maxDiscount ? Number(coupon.maxDiscount) : Infinity
                        );

                    await prisma.coupon.update({
                        where: { id: coupon.id },
                        data: { usedCount: { increment: 1 } }
                    });
                }
            }
        }

        const calculatedTotal = Math.max(0, calculatedSubtotal + deliveryCharge - discount);

        if (typeof totalAmount === 'number' && Math.abs(totalAmount - calculatedTotal) > 1) {
            throw new ApiError(400, 'Order total mismatch', [
                `Expected: ₹${calculatedTotal}`,
                `Received: ₹${totalAmount}`,
                `Subtotal: ₹${calculatedSubtotal}, Delivery: ₹${deliveryCharge}, Discount: ₹${discount}`,
            ]);
        }

        const order = await prisma.order.create({
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

        await Promise.all(
            items.map(item =>
                prisma.product.update({
                    where: { id: item.product },
                    data: {
                        stock: { decrement: item.quantity },
                        totalSold: { increment: item.quantity }
                    }
                })
            )
        );

        return order;
    }

    static async getOrders(user, filters) {
        const where = {};
        
        if (user.role === 'USER') {
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

        return prisma.order.findMany({
            where,
            include: {
                user: { select: { name: true, email: true } },
                items: true
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    static async getOrder(orderId, user) {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                user: { select: { id: true, name: true, email: true } },
                items: { include: { product: true } }
            }
        });

        if (!order) throw new ApiError(404, 'Order not found');
        
        if (user.role === 'USER' && order.userId !== user.id) {
            throw new ApiError(403, 'Not authorized to view this order');
        }

        return order;
    }

    static async updateOrderStatus(orderId, status, changedBy) {
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

    static async getOrderStats() {
        const [
            totalOrders,
            pendingOrders,
            deliveredOrders,
            revenueAgg,
            refundRequests,
            cancelledOrders,
            recentOrders
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
            })
        ]);

        const totalRevenue = Number(revenueAgg._sum.totalAmount || 0);

        return {
            totalOrders,
            pendingOrders,
            deliveredOrders,
            totalRevenue,
            totalProfit: totalRevenue * 0.2,
            refundRequests,
            cancelledOrders,
            recentOrders
        };
    }

    static async processRefund(orderId, { refundStatus, refundReason, refundAmount }, adminId) {
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

    static async updateTracking(orderId, { trackingNumber, trackingUrl, carrier }) {
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

    static async requestReturn(orderId, refundReason, user) {
        const order = await prisma.order.findUnique({
            where: { id: orderId }
        });

        if (!order) throw new ApiError(404, 'Order not found');
        
        if (user.role === 'USER' && order.userId !== user.id) {
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
    }
}

export default OrderService;
