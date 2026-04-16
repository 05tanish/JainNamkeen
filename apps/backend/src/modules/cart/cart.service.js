import Cart from './cart.model.js';
import Product from '../products/product.model.js';
import { ApiError } from '../../utils/ApiError.js';

class CartService {
    static async getCart(userId) {
        let cart = await Cart.findOne({ user: userId }).populate('items.product');
        if (!cart) {
            cart = await Cart.create({ user: userId, items: [] });
            await cart.populate('items.product');
        }
        return cart;
    }

    static async addToCart(userId, { productId, quantity = 1 }) {
        if (!productId?.match(/^[0-9a-fA-F]{24}$/)) throw new ApiError(400, 'Invalid product ID');

        const product = await Product.findById(productId);
        if (!product) throw new ApiError(404, 'Product not found');
        if (!product.isActive) throw new ApiError(400, 'Product is not available');

        const qty = parseInt(quantity);
        if (qty < 1) throw new ApiError(400, 'Quantity must be at least 1');

        let cart = await Cart.findOne({ user: userId });
        if (!cart) cart = await Cart.create({ user: userId, items: [] });

        const existingItem = cart.items.find(item => item.product.toString() === productId);
        if (existingItem) {
            const newQty = existingItem.quantity + qty;
            if (newQty > product.stock) {
                throw new ApiError(400, `Only ${product.stock} items available in stock`);
            }
            existingItem.quantity = newQty;
        } else {
            if (qty > product.stock) throw new ApiError(400, `Only ${product.stock} items available in stock`);
            cart.items.push({ product: productId, quantity: qty });
        }

        await cart.save();
        return cart.populate('items.product');
    }

    static async updateCartItem(userId, productId, quantity) {
        if (!productId.match(/^[0-9a-fA-F]{24}$/)) throw new ApiError(400, 'Invalid product ID');

        const cart = await Cart.findOne({ user: userId });
        if (!cart) throw new ApiError(404, 'Cart not found');

        const item = cart.items.find(i => i.product.toString() === productId);
        if (!item) throw new ApiError(404, 'Item not in cart');

        const qty = parseInt(quantity);
        if (qty <= 0) {
            cart.items = cart.items.filter(i => i.product.toString() !== productId);
        } else {
            const product = await Product.findById(productId);
            if (!product) throw new ApiError(404, 'Product not found');
            if (qty > product.stock) throw new ApiError(400, `Only ${product.stock} items available in stock`);
            item.quantity = qty;
        }

        await cart.save();
        return cart.populate('items.product');
    }

    static async removeFromCart(userId, productId) {
        if (!productId.match(/^[0-9a-fA-F]{24}$/)) throw new ApiError(400, 'Invalid product ID');
        const cart = await Cart.findOne({ user: userId });
        if (!cart) throw new ApiError(404, 'Cart not found');
        cart.items = cart.items.filter(i => i.product.toString() !== productId);
        await cart.save();
        return cart.populate('items.product');
    }

    static async clearCart(userId) {
        const cart = await Cart.findOne({ user: userId });
        if (cart) {
            cart.items = [];
            await cart.save();
        }
    }
}

export default CartService;
