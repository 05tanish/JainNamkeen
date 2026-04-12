import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Product name is required'],
            trim: true,
            maxlength: [200, 'Product name cannot exceed 200 characters'],
        },
        description: {
            type: String,
            default: '',
            trim: true,
        },
        price: {
            type: Number,
            required: [true, 'Price is required'],
            min: [0, 'Price cannot be negative'],
        },
        costPrice: {
            type: Number,
            default: 0,
            min: [0, 'Cost price cannot be negative'],
        },
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            required: [true, 'Category is required'],
            index: true,
        },
        images: [
            {
                url: { type: String, required: true },
                public_id: { type: String, default: '' },
            },
        ],
        stock: {
            type: Number,
            default: 0,
            min: [0, 'Stock cannot be negative'],
        },
        weight: {
            type: String,
            default: '250g',
            trim: true,
        },
        brand: {
            type: String,
            default: 'Sangam Namkeen',
            trim: true,
        },
        tags: [
            {
                type: String,
                trim: true,
                lowercase: true,
            },
        ],
        totalSold: {
            type: Number,
            default: 0,
            min: 0,
        },
        isFeatured: {
            type: Boolean,
            default: false,
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },
        lowStockThreshold: {
            type: Number,
            default: 10,
            min: 0,
        },
        flashSalePrice: {
            type: Number,
            default: null,
            min: 0,
        },
        flashSaleEnd: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
        toJSON: { versionKey: false },
        toObject: { versionKey: false },
    }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
// Full-text search on name, description, tags
productSchema.index({ name: 'text', description: 'text', tags: 'text' });

// Most common listing query: active products per category
productSchema.index({ category: 1, isActive: 1 });

// Featured + active (homepage carousels)
productSchema.index({ isFeatured: 1, isActive: 1 });

// Sort by newest / best sellers
productSchema.index({ createdAt: -1 });
productSchema.index({ totalSold: -1 });

// Low-stock alert queries
productSchema.index({ isActive: 1, stock: 1 });

export default mongoose.model('Product', productSchema);
