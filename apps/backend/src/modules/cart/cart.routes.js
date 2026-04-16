import express from 'express';
import { auth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { cartItemSchema, updateCartItemSchema } from './cart.schema.js';
import {
    getCart, addToCart, updateCartItem,
    removeFromCart, clearCart
} from './cart.controller.js';

const router = express.Router();

// All cart routes require auth (user only)
router.use(auth);

router.get('/', getCart);
router.post('/', validate(cartItemSchema), addToCart);
router.put('/:productId', validate(updateCartItemSchema), updateCartItem);
router.delete('/clear', clearCart);
router.delete('/:productId', removeFromCart);

export default router;
