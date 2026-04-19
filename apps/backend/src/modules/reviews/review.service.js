import Review from './review.model.js';
import { prisma } from '../../config/Postgrsedb.js';
import { ApiError } from '../../utils/ApiError.js';

export const getProductReviews = async (productId) => {
        const reviews = await Review.find({ product: productId })
            .populate('user', 'name')
            .sort({ createdAt: -1 });
        const totalReviews = reviews.length;
        const averageRating = totalReviews > 0
            ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1)
            : 0;
        return { reviews, stats: { totalReviews, averageRating } };
    }

export const createReview = async (productId, userId, { rating, comment }, files) => {
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

export const updateReview = async (reviewId, userId, userRole, { rating, comment, existingImages }, files) => {
        const review = await Review.findById(reviewId);
        if (!review) throw new ApiError(404, 'Review not found');
        if (review.user.toString() !== userId.toString() && userRole?.toUpperCase() !== 'ADMIN') {
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

export const deleteReview = async (reviewId, userId, userRole) => {
        const review = await Review.findById(reviewId);
        if (!review) throw new ApiError(404, 'Review not found');
        if (review.user.toString() !== userId.toString() && userRole?.toUpperCase() !== 'ADMIN') {
            throw new ApiError(403, 'Not authorized to delete this review');
        }
        await Review.deleteOne({ _id: reviewId });
    }

export const getAllReviewsAdmin = async ({ product, rating, hasReply }) => {
        const query = {};
        if (product) query.product = product;
        if (rating) query.rating = Number(rating);
        if (hasReply === 'true') query.reply = { $exists: true, $ne: '' };
        if (hasReply === 'false') query.reply = { $exists: false };
        
        const reviewsRaw = await Review.find(query).lean().sort({ createdAt: -1 });
        
        const userIds = [...new Set(reviewsRaw.map(r => r.user).filter(Boolean))];
        const productIds = [...new Set(reviewsRaw.map(r => r.product).filter(Boolean))];

        const [users, products] = await Promise.all([
            prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, phone: true, email: true } }),
            prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true, images: true, price: true } })
        ]);

        const userMap = Object.fromEntries(users.map(u => [u.id, u]));
        const productMap = Object.fromEntries(products.map(p => {
            let thumbnail = null;
            if (p.images) {
                const images = typeof p.images === 'string' ? JSON.parse(p.images) : p.images;
                thumbnail = Array.isArray(images) && images.length > 0 ? images[0] : null;
            }
            return [p.id, { id: p.id, name: p.name, price: p.price, thumbnail }];
        }));

        return reviewsRaw.map(r => ({
            ...r,
            user: userMap[r.user] || { name: 'Unknown User' },
            product: productMap[r.product] || { name: 'Unknown Product' }
        }));
    }

export const replyToReview = async (reviewId, reply) => {
        if (!reply) throw new ApiError(400, 'Reply content is required');
        const reviewRaw = await Review.findByIdAndUpdate(
            reviewId,
            { reply, replyDate: new Date() },
            { new: true }
        ).lean();
        if (!reviewRaw) throw new ApiError(404, 'Review not found');

        const [user, product] = await Promise.all([
            prisma.user.findUnique({ where: { id: reviewRaw.user }, select: { id: true, name: true } }),
            prisma.product.findUnique({ where: { id: reviewRaw.product }, select: { id: true, name: true } })
        ]);

        return {
            ...reviewRaw,
            user: user || { name: 'Unknown User' },
            product: product || { name: 'Unknown Product' }
        };
    }

export const getReviewAnalytics = async () => {
        // Get top rated products from MongoDB reviews
        const topRatedRaw = await Review.aggregate([
            { $group: { _id: '$product', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
            { $match: { count: { $gte: 1 } } },
            { $sort: { avgRating: -1, count: -1 } },
            { $limit: 10 }
        ]);

        const topProductIds = topRatedRaw.map(r => r._id).filter(Boolean);
        const topProducts = await prisma.product.findMany({
            where: { id: { in: topProductIds } },
            select: { id: true, name: true, images: true, price: true }
        });
        
        const topProductMap = Object.fromEntries(topProducts.map(p => {
            let thumbnail = null;
            if (p.images) {
                const images = typeof p.images === 'string' ? JSON.parse(p.images) : p.images;
                thumbnail = Array.isArray(images) && images.length > 0 ? images[0] : null;
            }
            return [p.id, { name: p.name, price: p.price, thumbnail }];
        }));

        const topRated = topRatedRaw.map(r => {
            const p = topProductMap[r._id] || {};
            return {
                _id: r._id,
                avgRating: r.avgRating,
                reviewCount: r.count,
                name: p.name || 'Unknown',
                thumbnail: p.thumbnail,
                price: p.price || 0
            };
        });

        // Get most bought products from Prisma orders
        const orderItems = await prisma.orderItem.groupBy({
            by: ['productId'],
            where: {
                order: {
                    status: {
                        not: 'CANCELLED'
                    }
                }
            },
            _sum: {
                quantity: true
            },
            _count: {
                id: true
            },
            orderBy: {
                _sum: {
                    quantity: 'desc'
                }
            },
            take: 10
        });

        // Get product details and calculate revenue for most bought products
        const mostBought = await Promise.all(
            orderItems.map(async (item) => {
                const product = await prisma.product.findUnique({
                    where: { id: item.productId },
                    select: { id: true, name: true, images: true, price: true }
                });

                // Calculate revenue for this product
                const orderItemsForRevenue = await prisma.orderItem.findMany({
                    where: {
                        productId: item.productId,
                        order: {
                            status: {
                                not: 'CANCELLED'
                            }
                        }
                    },
                    select: {
                        price: true,
                        quantity: true
                    }
                });

                const revenue = orderItemsForRevenue.reduce((sum, oi) => {
                    return sum + (parseFloat(oi.price.toString()) * oi.quantity);
                }, 0);

                // Extract thumbnail from images JSON
                let thumbnail = null;
                if (product && product.images) {
                    const images = typeof product.images === 'string' 
                        ? JSON.parse(product.images) 
                        : product.images;
                    thumbnail = Array.isArray(images) && images.length > 0 ? images[0] : null;
                }

                return {
                    _id: item.productId,
                    totalSold: item._sum.quantity || 0,
                    revenue: revenue,
                    name: product?.name || 'Unknown Product',
                    thumbnail: thumbnail,
                    price: product?.price || 0
                };
            })
        );

        return { topRated, mostBought };
};
