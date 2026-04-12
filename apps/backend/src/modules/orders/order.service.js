import Order from './order.model.js';
import Product from '../products/product.model.js';
import ApiError from '../../utils/ApiError.js';

const VALID_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

class OrderService {
    static async createOrder(userId, { items, totalAmount, shippingAddress, paymentMethod, couponCode }) {
        if (!items || items.length === 0) throw new ApiError(400, 'No items in order');

        // Validate shipping address completeness
        const addr = shippingAddress;
        if (!addr?.name || !addr?.phone || !addr?.street || !addr?.city || !addr?.state || !addr?.pincode) {
            throw new ApiError(400, 'Complete shipping address is required (name, phone, street, city, state, pincode)');
        }

        // Validate products and calculate subtotal
        let calculatedSubtotal = 0;
        for (const item of items) {
            if (!item.product?.match(/^[0-9a-fA-F]{24}$/)) {
                throw new ApiError(400, 'Invalid product ID in order items');
            }
            const product = await Product.findById(item.product);
            if (!product) throw new ApiError(404, `Product ${item.product} not found`);
            if (!product.isActive) throw new ApiError(400, `Product "${product.name}" is not available`);
            if (item.quantity > product.stock) {
                throw new ApiError(400, `Insufficient stock for "${product.name}". Available: ${product.stock}`);
            }
            calculatedSubtotal += product.price * item.quantity;
        }

        // Delivery charge
        const deliveryCharge = calculatedSubtotal >= 500 ? 0 : 40;

        // Coupon discount
        let discount = 0;
        if (couponCode) {
            const { default: Coupon } = await import('../coupons/coupon.model.js');
            const coupon = await Coupon.findOne({
                code: couponCode.toUpperCase(),
                isActive: true,
                validUntil: { $gte: new Date() },
            });
            if (coupon && calculatedSubtotal >= (coupon.minOrderAmount || 0)) {
                // Model enum uses 'flat', not 'fixed' — CRITICAL fix
                discount = coupon.discountType === 'flat'
                    ? coupon.discountValue
                    : Math.min(
                        (calculatedSubtotal * coupon.discountValue) / 100,
                        coupon.maxDiscount || Infinity
                    );
            }
        }

        const calculatedTotal = Math.max(0, calculatedSubtotal + deliveryCharge - discount);

        // Allow ±1 rounding tolerance
        if (typeof totalAmount === 'number' && Math.abs(totalAmount - calculatedTotal) > 1) {
            throw new ApiError(400, 'Order total mismatch', [
                `Expected: ₹${calculatedTotal}`,
                `Received: ₹${totalAmount}`,
                `Subtotal: ₹${calculatedSubtotal}, Delivery: ₹${deliveryCharge}, Discount: ₹${discount}`,
            ]);
        }

        const order = await Order.create({
            user: userId,
            items,
            subtotal: calculatedSubtotal,
            discount,
            couponCode: couponCode?.toUpperCase() || '',
            totalAmount: calculatedTotal,
            shippingAddress,
            paymentMethod,
            statusHistory: [{ status: 'pending' }],
        });

        // Decrement stock in parallel
        await Promise.all(
            items.map(item =>
                Product.findByIdAndUpdate(item.product, {
                    $inc: { stock: -item.quantity, totalSold: item.quantity },
                })
            )
        );

        return order;
    }

    static async getOrders(user, filters) {
        const query = {};
        if (user.role === 'user') {
            query.user = user._id;
        } else {
            if (filters.status) {
                if (!VALID_STATUSES.includes(filters.status)) throw new ApiError(400, 'Invalid status filter');
                query.status = filters.status;
            }
        }
        const orders = await Order.find(query).populate('user', 'name email').sort({ createdAt: -1 });
        return orders;
    }

    static async getOrder(orderId, user) {
        if (!orderId.match(/^[0-9a-fA-F]{24}$/)) throw new ApiError(400, 'Invalid order ID');
        const order = await Order.findById(orderId).populate('user', 'name email');
        if (!order) throw new ApiError(404, 'Order not found');
        if (user.role === 'user' && order.user._id.toString() !== user._id.toString()) {
            throw new ApiError(403, 'Not authorized to view this order');
        }
        return order;
    }

    static async updateOrderStatus(orderId, status, changedBy) {
        if (!orderId.match(/^[0-9a-fA-F]{24}$/)) throw new ApiError(400, 'Invalid order ID');
        if (!VALID_STATUSES.includes(status)) throw new ApiError(400, `Invalid status. Must be: ${VALID_STATUSES.join(', ')}`);
        const order = await Order.findById(orderId);
        if (!order) throw new ApiError(404, 'Order not found');
        order.status = status;
        order.statusHistory.push({ status, changedBy });
        await order.save();
        return order;
    }

    static async getOrderStats() {
        const [totalOrders, pendingOrders, deliveredOrders, revenueAgg, locationStats, refundRequests, cancelledOrders, recentOrders] =
            await Promise.all([
                Order.countDocuments(),
                Order.countDocuments({ status: 'pending' }),
                Order.countDocuments({ status: 'delivered' }),
                Order.aggregate([{ $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }]),
                Order.aggregate([
                    { $group: { _id: { city: '$shippingAddress.city', state: '$shippingAddress.state' }, count: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
                ]),
                Order.countDocuments({ refundStatus: { $ne: 'none' } }),
                Order.countDocuments({ status: 'cancelled' }),
                Order.find().populate('user', 'name email').sort({ createdAt: -1 }).limit(5),
            ]);

        return {
            totalOrders,
            pendingOrders,
            deliveredOrders,
            totalRevenue: revenueAgg[0]?.totalRevenue ?? 0,
            totalProfit: (revenueAgg[0]?.totalRevenue ?? 0) * 0.2,
            locationStats,
            refundRequests,
            cancelledOrders,
            recentOrders,
        };
    }

    static async processRefund(orderId, { refundStatus, refundReason, refundAmount }, adminId) {
        if (!orderId.match(/^[0-9a-fA-F]{24}$/)) throw new ApiError(400, 'Invalid order ID');
        const order = await Order.findById(orderId);
        if (!order) throw new ApiError(404, 'Order not found');
        if (refundAmount && refundAmount > order.totalAmount) {
            throw new ApiError(400, 'Refund amount cannot exceed order total');
        }
        order.refundStatus = refundStatus;
        if (refundReason) order.refundReason = refundReason;
        if (refundAmount) order.refundAmount = refundAmount;
        if (refundStatus === 'completed') order.refundedAt = new Date();
        if (['approved', 'completed'].includes(refundStatus) && order.status !== 'cancelled') {
            order.status = 'cancelled';
            order.statusHistory.push({ status: 'cancelled', changedBy: adminId });
        }
        await order.save();
        return order;
    }

    static async updateTracking(orderId, { trackingNumber, trackingUrl, carrier }) {
        if (!orderId.match(/^[0-9a-fA-F]{24}$/)) throw new ApiError(400, 'Invalid order ID');
        const order = await Order.findById(orderId);
        if (!order) throw new ApiError(404, 'Order not found');
        if (trackingNumber) order.trackingNumber = trackingNumber;
        if (trackingUrl) order.trackingUrl = trackingUrl;
        if (carrier) order.carrier = carrier;
        await order.save();
        return order;
    }

    static async requestReturn(orderId, refundReason, user) {
        if (!orderId.match(/^[0-9a-fA-F]{24}$/)) throw new ApiError(400, 'Invalid order ID');
        const order = await Order.findById(orderId);
        if (!order) throw new ApiError(404, 'Order not found');
        if (user.role === 'user' && order.user.toString() !== user._id.toString()) {
            throw new ApiError(403, 'Not authorized');
        }
        if (order.status !== 'delivered') throw new ApiError(400, 'Only delivered orders can be returned');
        if (order.refundStatus !== 'none') throw new ApiError(400, 'Return already requested for this order');
        order.refundStatus = 'requested';
        if (refundReason) order.refundReason = refundReason;
        await order.save();
        return order;
    }
}

export default OrderService;
