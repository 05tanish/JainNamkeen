import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Banner title is required'],
        trim: true
    },
    subtitle: {
        type: String,
        default: ''
    },
    image: {
        type: String,
        default: ''
    },
    link: {
        type: String,
        default: ''
    },
    position: {
        type: String,
        enum: ['hero', 'sidebar', 'popup', 'footer'],
        default: 'hero'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    endDate: {
        type: Date,
        default: null
    }
}, { timestamps: true });

export default mongoose.model('Banner', bannerSchema);
