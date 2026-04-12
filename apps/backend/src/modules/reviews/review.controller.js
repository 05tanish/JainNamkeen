import asyncHandler from '../../utils/asyncHandler.js';
import { successResponse } from '../../utils/ApiResponse.js';
import ReviewService from './review.service.js';

// GET /api/reviews/product/:id
export const getProductReviews = asyncHandler(async (req, res) => {
    const result = await ReviewService.getProductReviews(req.params.id);
    successResponse(res, { statusCode: 200, data: result, message: 'Reviews fetched' });
});

// POST /api/reviews/product/:id
export const createReview = asyncHandler(async (req, res) => {
    const review = await ReviewService.createReview(req.params.id, req.user._id, req.body, req.files);
    successResponse(res, { statusCode: 201, data: review, message: 'Review submitted' });
});

// PUT /api/reviews/:id
export const updateReview = asyncHandler(async (req, res) => {
    const review = await ReviewService.updateReview(req.params.id, req.user._id, req.user.role, req.body, req.files);
    successResponse(res, { statusCode: 200, data: review, message: 'Review updated' });
});

// DELETE /api/reviews/:id
export const deleteReview = asyncHandler(async (req, res) => {
    await ReviewService.deleteReview(req.params.id, req.user._id, req.user.role);
    successResponse(res, { statusCode: 200, data: null, message: 'Review deleted' });
});

// GET /api/reviews/admin
export const getAllReviewsAdmin = asyncHandler(async (req, res) => {
    const reviews = await ReviewService.getAllReviewsAdmin(req.query);
    successResponse(res, { statusCode: 200, data: reviews, message: 'All reviews fetched' });
});

// PATCH /api/reviews/:id/reply
export const replyToReview = asyncHandler(async (req, res) => {
    const review = await ReviewService.replyToReview(req.params.id, req.body.reply);
    successResponse(res, { statusCode: 200, data: review, message: 'Reply added' });
});

// GET /api/reviews/analytics/highlights
export const getReviewAnalytics = asyncHandler(async (req, res) => {
    const data = await ReviewService.getReviewAnalytics();
    successResponse(res, { statusCode: 200, data: data, message: 'Analytics fetched' });
});
