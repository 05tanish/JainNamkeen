import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: 0
    },
    costPrice: {
        type: Number,
        default: 0,
        min: 0
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'Category is required']
    },
    images: [{
        url: String,
        public_id: String
    }],
    stock: {
        type: Number,
        default: 0,
        min: 0
    },
    weight: {
        type: String,
        default: '250g'
    },
    brand: {
        type: String,
        default: 'Sangam Namkeen',
        trim: true
    },
    tags: [{
        type: String,
        trim: true,
        lowercase: true
    }],
    totalSold: {
        type: Number,
        default: 0,
        min: 0
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lowStockThreshold: {
        type: Number,
        default: 10
    },
    flashSalePrice: {
        type: Number,
        default: null
    },
    flashSaleEnd: {
        type: Date,
        default: null
    }
}, { timestamps: true });

// Text index for search
productSchema.index({ name: 'text', description: 'text', tags: 'text' });

export default mongoose.model('Product', productSchema);
