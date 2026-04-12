import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Category name is required'],
        unique: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    image: {
        type: String,
        default: ''
    }
}, { timestamps: true, toJSON: { versionKey: false }, toObject: { versionKey: false } });

export default mongoose.model('Category', categorySchema);
