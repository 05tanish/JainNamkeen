import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
    // Prisma uses CUIDs (strings), not MongoDB ObjectIds
    product: {
        type: String,
        required: true
    },
    user: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        required: true,
        trim: true
    },
    images: [{
        type: String // URLs or file paths to uploaded review images
    }],
    reply: {
        type: String,
        trim: true
    },
    replyDate: {
        type: Date
    }
}, {
    timestamps: true
});

// Prevent user from reviewing the same product twice
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

const Review = mongoose.model('Review', reviewSchema);

export default Review;
