import Order from './order.model.js';
import Product from '../products/product.model.js';

export const createOrder = async (req, res) => {
    try {
        const { items, totalAmount, shippingAddress, paymentMethod, couponCode } = req.body;
        
        // Validate items array
        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'No items in order' });
        }
        
        // Validate all products exist and calculate actual total
        let calculatedSubtotal = 0;
        for (const item of items) {
            if (!item.product || !item.product.match(/^[0-9a-fA-F]{24}$/)) {
                return res.status(400).json({ message: 'Invalid product ID in order items' });
            }
            
            const product = await Product.findById(item.product);
            if (!product) {
                return res.status(404).json({ message: `Product ${item.product} not found` });
            }
            if (!product.isActive) {
                return res.status(400).json({ message: `Product ${product.name} is not available` });
            }
            if (item.quantity > product.stock) {
                return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
            }
            
            calculatedSubtotal += product.price * item.quantity;
        }
        
        // Calculate delivery charge (free delivery for orders >= 500)
        const deliveryCharge = calculatedSubtotal >= 500 ? 0 : 40;
        
        // Calculate discount if coupon is applied
        let discount = 0;
        if (couponCode) {
            const Coupon = (await import('../coupons/coupon.model.js')).default;
            const coupon = await Coupon.findOne({ 
                code: couponCode.toUpperCase(), 
                isActive: true,
                validUntil: { $gte: new Date() }
            });
            
            if (coupon && calculatedSubtotal >= (coupon.minOrderAmount || 0)) {
                if (coupon.discountType === 'fixed') {
                    discount = coupon.discountValue;
                } else if (coupon.discountType === 'percentage') {
                    discount = (calculatedSubtotal * coupon.discountValue) / 100;
                    if (coupon.maxDiscount) {
                        discount = Math.min(discount, coupon.maxDiscount);
                    }
                }
            }
        }
        
        // Calculate expected total
        const calculatedTotal = Math.max(0, calculatedSubtotal + deliveryCharge - discount);
        
        // Validate totalAmount matches calculated total (allow small rounding difference)
        if (Math.abs(totalAmount - calculatedTotal) > 1) {
            return res.status(400).json({ 
                message: 'Total amount mismatch',
                expected: calculatedTotal,
                received: totalAmount,
                breakdown: {
                    subtotal: calculatedSubtotal,
                    deliveryCharge,
                    discount,
                    total: calculatedTotal
                }
            });
        }
        
        // Validate shipping address
        if (!shippingAddress || !shippingAddress.name || !shippingAddress.phone || 
            !shippingAddress.street || !shippingAddress.city || !shippingAddress.state || 
            !shippingAddress.pincode) {
            return res.status(400).json({ message: 'Complete shipping address is required' });
        }

        const order = new Order({
            user: req.user._id,
            items,
            totalAmount: calculatedTotal, // Use calculated total to ensure accuracy
            shippingAddress,
            paymentMethod
        });
        await order.save();
        
        // Update product stock
        for (const item of items) {
            await Product.findByIdAndUpdate(item.product, {
                $inc: { stock: -item.quantity, totalSold: item.quantity }
            });
        }
        
        res.status(201).json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getOrders = async (req, res) => {
    try {
        let query = {};
        if (req.user.role === 'user') {
            query.user = req.user._id;
        } else {
            if (req.query.status) query.status = req.query.status;
        }
        const orders = await Order.find(query).populate('user', 'name email').sort({ createdAt: -1 });
        res.json({ orders });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getOrder = async (req, res) => {
    try {
        // Validate ObjectId format
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: 'Invalid order ID format' });
        }
        
        const order = await Order.findById(req.params.id).populate('user', 'name email');
        if (!order) return res.status(404).json({ message: 'Order not found' });

        if (req.user.role === 'user' && order.user._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateOrderStatus = async (req, res) => {
    try {
        // Validate ObjectId format
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: 'Invalid order ID format' });
        }
        
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });
        
        // Validate status transition
        const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(req.body.status)) {
            return res.status(400).json({ message: 'Invalid order status' });
        }

        order.status = req.body.status;
        order.statusHistory.push({
            status: req.body.status,
            changedBy: req.user._id
        });
        await order.save();
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getOrderStats = async (req, res) => {
    try {
        const totalOrders = await Order.countDocuments();
        const pendingOrders = await Order.countDocuments({ status: 'pending' });
        const deliveredOrders = await Order.countDocuments({ status: 'delivered' });
        
        const revenueAgg = await Order.aggregate([
            { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } }
        ]);
        const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].totalRevenue : 0;
        const totalProfit = totalRevenue * 0.2; // rough estimate
        
        const recentOrders = await Order.find().populate('user', 'name email').sort({ createdAt: -1 }).limit(5);

        const locationStats = await Order.aggregate([
            {
                $group: {
                    _id: { city: "$shippingAddress.city", state: "$shippingAddress.state" },
                    count: { $sum: 1 },
                    revenue: { $sum: "$totalAmount" }
                }
            }
        ]);

        const refundRequests = await Order.countDocuments({ refundStatus: { $ne: 'none' } });
        const cancelledOrders = await Order.countDocuments({ status: 'cancelled' });

        res.json({
            totalOrders,
            pendingOrders,
            deliveredOrders,
            totalRevenue,
            totalProfit,
            recentOrders,
            locationStats,
            refundRequests,
            cancelledOrders
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// PUT /api/orders/:id/refund
export const processRefund = async (req, res) => {
    try {
        // Validate ObjectId format
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: 'Invalid order ID format' });
        }
        
        const { refundStatus, refundReason, refundAmount } = req.body;
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });
        
        // Validate refund amount doesn't exceed order total
        if (refundAmount && refundAmount > order.totalAmount) {
            return res.status(400).json({ message: 'Refund amount cannot exceed order total' });
        }

        order.refundStatus = refundStatus;
        if (refundReason) order.refundReason = refundReason;
        if (refundAmount) order.refundAmount = refundAmount;
        if (refundStatus === 'completed') order.refundedAt = new Date();

        // If refund approved/completed, also cancel the order
        if (['approved', 'completed'].includes(refundStatus) && order.status !== 'cancelled') {
            order.status = 'cancelled';
            order.statusHistory.push({
                status: 'cancelled',
                changedBy: req.user._id
            });
        }

        await order.save();
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// PUT /api/orders/:id/tracking
export const updateTracking = async (req, res) => {
    try {
        // Validate ObjectId format
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: 'Invalid order ID format' });
        }
        
        const { trackingNumber, trackingUrl, carrier } = req.body;
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        if (trackingNumber) order.trackingNumber = trackingNumber;
        if (trackingUrl) order.trackingUrl = trackingUrl;
        if (carrier) order.carrier = carrier;

        await order.save();
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// PUT /api/orders/:id/request-return
export const requestReturn = async (req, res) => {
    try {
        // Validate ObjectId format
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: 'Invalid order ID format' });
        }
        
        const { refundReason } = req.body;
        const order = await Order.findById(req.params.id);

        if (!order) return res.status(404).json({ message: 'Order not found' });

        // Ensure the order belongs to the user
        if (order.user.toString() !== req.user._id.toString() && req.user.role === 'user') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Validate state for return (e.g., must be delivered, no previous refund requested)
        if (order.status !== 'delivered') {
            return res.status(400).json({ message: 'Only delivered orders can be returned' });
        }
        if (order.refundStatus !== 'none') {
            return res.status(400).json({ message: 'Return already requested for this order' });
        }

        order.refundStatus = 'requested';
        if (refundReason) order.refundReason = refundReason;

        await order.save();
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
