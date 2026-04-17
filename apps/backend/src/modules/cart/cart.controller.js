import { asyncHandler } from '../../utils/asyncHandler.js';
import { successResponse } from '../../utils/ApiResponse.js';
import * as CartService from './cart.service.js';

export const getCart = asyncHandler(async (req, res) => {
    const cart = await CartService.getCart(req.user._id);
    successResponse(res, { statusCode: 200, data: cart, message: 'Cart fetched' });
});

export const addToCart = asyncHandler(async (req, res) => {
    const cart = await CartService.addToCart(req.user._id, req.body);
    successResponse(res, { statusCode: 200, data: cart, message: 'Item added to cart' });
});

export const updateCartItem = asyncHandler(async (req, res) => {
    const cart = await CartService.updateCartItem(req.user._id, req.params.productId, req.body.quantity);
    successResponse(res, { statusCode: 200, data: cart, message: 'Cart updated' });
});

export const removeFromCart = asyncHandler(async (req, res) => {
    const cart = await CartService.removeFromCart(req.user._id, req.params.productId);
    successResponse(res, { statusCode: 200, data: cart, message: 'Item removed from cart' });
});

export const clearCart = asyncHandler(async (req, res) => {
    await CartService.clearCart(req.user._id);
    successResponse(res, { statusCode: 200, data: null, message: 'Cart cleared' });
});
