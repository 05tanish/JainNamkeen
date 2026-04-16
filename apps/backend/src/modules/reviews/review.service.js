import Review from './review.model.js';
import Order from '../orders/order.model.js';
import { ApiError } from '../../utils/ApiError.js';

class ReviewService {
    static async getProductReviews(productId) {
        const reviews = await Review.find({ product: productId })
            .populate('user', 'name')
            .sort({ createdAt: -1 });
        const totalReviews = reviews.length;
        const averageRating = totalReviews > 0
            ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1)
            : 0;
        return { reviews, stats: { totalReviews, averageRating } };
    }

    static async createReview(productId, userId, { rating, comment }, files) {
        const existing = await Review.findOne({ product: productId, user: userId });
        if (existing) throw new ApiError(400, 'You have already reviewed this product');

        const images = files?.map(f => `/uploads/reviews/${f.filename}`) ?? [];
        return Review.create({
            product: productId,
            user: userId,
            rating: Number(rating),
            comment,
            images,
        });
    }

    static async updateReview(reviewId, userId, userRole, { rating, comment, existingImages }, files) {
        const review = await Review.findById(reviewId);
        if (!review) throw new ApiError(404, 'Review not found');
        if (review.user.toString() !== userId.toString() && userRole !== 'admin') {
            throw new ApiError(403, 'Not authorized to edit this review');
        }

        if (rating) review.rating = Number(rating);
        if (comment) review.comment = comment;

        let updatedImages = [];
        if (existingImages) {
            updatedImages = Array.isArray(existingImages) ? existingImages : [existingImages];
        } else if (existingImages !== '') {
            updatedImages = [...review.images];
        }
        if (files?.length) {
            files.forEach(f => updatedImages.push(`/uploads/reviews/${f.filename}`));
        }
        review.images = updatedImages;
        await review.save();
        return review;
    }

    static async deleteReview(reviewId, userId, userRole) {
        const review = await Review.findById(reviewId);
        if (!review) throw new ApiError(404, 'Review not found');
        if (review.user.toString() !== userId.toString() && userRole !== 'admin') {
            throw new ApiError(403, 'Not authorized to delete this review');
        }
        await Review.deleteOne({ _id: reviewId });
    }

    static async getAllReviewsAdmin({ product, rating, hasReply }) {
        const query = {};
        if (product) query.product = product;
        if (rating) query.rating = Number(rating);
        if (hasReply === 'true') query.reply = { $exists: true, $ne: '' };
        if (hasReply === 'false') query.reply = { $exists: false };
        return Review.find(query)
            .populate('user', 'name phone email')
            .populate('product', 'name thumbnail price')
            .sort({ createdAt: -1 });
    }

    static async replyToReview(reviewId, reply) {
        if (!reply) throw new ApiError(400, 'Reply content is required');
        const review = await Review.findByIdAndUpdate(
            reviewId,
            { reply, replyDate: new Date() },
            { new: true }
        ).populate('user', 'name').populate('product', 'name');
        if (!review) throw new ApiError(404, 'Review not found');
        return review;
    }

    static async getReviewAnalytics() {
        const [topRated, mostBought] = await Promise.all([
            Review.aggregate([
                { $group: { _id: '$product', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
                { $match: { count: { $gte: 1 } } },
                { $sort: { avgRating: -1, count: -1 } },
                { $limit: 10 },
                { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
                { $unwind: '$product' },
                { $project: { _id: 1, avgRating: 1, reviewCount: '$count', name: '$product.name', thumbnail: '$product.thumbnail', price: '$product.price' } },
            ]),
            Order.aggregate([
                { $match: { status: { $ne: 'cancelled' } } },
                { $unwind: '$items' },
                { $group: { _id: '$items.product', totalSold: { $sum: '$items.quantity' }, revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
                { $sort: { totalSold: -1 } },
                { $limit: 10 },
                { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
                { $unwind: '$product' },
                { $project: { _id: 1, totalSold: 1, revenue: 1, name: '$product.name', thumbnail: '$product.thumbnail', price: '$product.price' } },
            ]),
        ]);
        return { topRated, mostBought };
    }
}

export default ReviewService;
