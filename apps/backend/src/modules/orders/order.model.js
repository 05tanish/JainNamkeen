import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Order must belong to a user'],
            index: true,
        },
        items: [
            {
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Product',
                    required: true,
                },
                name: { type: String, required: true },
                price: { type: Number, required: true, min: 0 },
                quantity: { type: Number, required: true, min: 1 },
                image: { type: String, default: '' },
            },
        ],
        subtotal: {
            type: Number,
            required: true,
            min: 0,
        },
        discount: {
            type: Number,
            default: 0,
            min: 0,
        },
        couponCode: {
            type: String,
            default: '',
            uppercase: true,
            trim: true,
        },
        totalAmount: {
            type: Number,
            required: true,
            min: 0,
        },
        shippingAddress: {
            name:    { type: String, required: true, trim: true },
            phone:   { type: String, required: true, trim: true },
            street:  { type: String, required: true, trim: true },
            city:    { type: String, required: true, trim: true },
            state:   { type: String, required: true, trim: true },
            pincode: { type: String, required: true, trim: true },
        },
        status: {
            type: String,
            enum: {
                values: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
                message: 'Invalid order status',
            },
            default: 'pending',
            index: true,
        },
        paymentMethod: {
            type: String,
            enum: { values: ['cod', 'online'], message: 'Payment method must be cod or online' },
            default: 'cod',
        },
        paymentStatus: {
            type: String,
            enum: ['unpaid', 'paid', 'refunded'],
            default: 'unpaid',
        },
        // ── Refund ────────────────────────────────────────────────────────────
        refundStatus: {
            type: String,
            enum: {
                values: ['none', 'requested', 'approved', 'rejected', 'completed'],
                message: 'Invalid refund status',
            },
            default: 'none',
        },
        refundReason: { type: String, default: '', trim: true },
        refundAmount:  { type: Number, default: 0, min: 0 },
        refundedAt:    { type: Date, default: null },
        // ── Tracking ──────────────────────────────────────────────────────────
        trackingNumber: { type: String, default: '', trim: true },
        trackingUrl:    { type: String, default: '', trim: true },
        carrier:        { type: String, default: '', trim: true },
        // ── Audit trail ───────────────────────────────────────────────────────
        statusHistory: [
            {
                status:    { type: String, required: true },
                changedAt: { type: Date, default: Date.now },
                changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            },
        ],
    },
    {
        timestamps: true,
        toJSON:   { versionKey: false },
        toObject: { versionKey: false },
    }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
orderSchema.index({ user: 1, createdAt: -1 });     // user's order history
orderSchema.index({ status: 1, createdAt: -1 });   // admin order management
orderSchema.index({ createdAt: -1 });               // global latest orders
orderSchema.index({ couponCode: 1 }, { sparse: true }); // coupon usage reports

export default mongoose.model('Order', orderSchema);
