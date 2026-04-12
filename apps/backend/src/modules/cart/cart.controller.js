import asyncHandler from '../../utils/asyncHandler.js';
import { successResponse } from '../../utils/ApiResponse.js';
import CartService from './cart.service.js';

// GET /api/cart
export const getCart = asyncHandler(async (req, res) => {
    const cart = await CartService.getCart(req.user._id);
    successResponse(res, { statusCode: 200, data: cart, message: 'Cart fetched' });
});

// POST /api/cart
export const addToCart = asyncHandler(async (req, res) => {
    const cart = await CartService.addToCart(req.user._id, req.body);
    successResponse(res, { statusCode: 200, data: cart, message: 'Item added to cart' });
});

// PUT /api/cart/:productId
export const updateCartItem = asyncHandler(async (req, res) => {
    const cart = await CartService.updateCartItem(req.user._id, req.params.productId, req.body.quantity);
    successResponse(res, { statusCode: 200, data: cart, message: 'Cart updated' });
});

// DELETE /api/cart/:productId
export const removeFromCart = asyncHandler(async (req, res) => {
    const cart = await CartService.removeFromCart(req.user._id, req.params.productId);
    successResponse(res, { statusCode: 200, data: cart, message: 'Item removed from cart' });
});

// DELETE /api/cart
export const clearCart = asyncHandler(async (req, res) => {
    await CartService.clearCart(req.user._id);
    successResponse(res, { statusCode: 200, data: null, message: 'Cart cleared' });
});
