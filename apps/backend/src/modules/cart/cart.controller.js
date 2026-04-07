import Cart from './cart.model.js';
import Product from '../products/product.model.js';

// GET /api/cart
export const getCart = async (req, res) => {
    try {
        let cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
        if (!cart) {
            cart = await Cart.create({ user: req.user._id, items: [] });
        }
        res.json(cart);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// POST /api/cart — add item
export const addToCart = async (req, res) => {
    try {
        const { productId, quantity = 1 } = req.body;
        
        // Validate ObjectId format
        if (!productId || !productId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: 'Invalid product ID format' });
        }
        
        // Validate product exists and is active
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        if (!product.isActive) {
            return res.status(400).json({ message: 'Product is not available' });
        }
        
        // Validate quantity
        if (quantity < 1) {
            return res.status(400).json({ message: 'Quantity must be at least 1' });
        }
        if (quantity > product.stock) {
            return res.status(400).json({ message: `Only ${product.stock} items available in stock` });
        }
        
        let cart = await Cart.findOne({ user: req.user._id });

        if (!cart) {
            cart = await Cart.create({ user: req.user._id, items: [] });
        }

        const existingItem = cart.items.find(
            item => item.product.toString() === productId
        );

        if (existingItem) {
            const newQuantity = existingItem.quantity + quantity;
            if (newQuantity > product.stock) {
                return res.status(400).json({ message: `Only ${product.stock} items available in stock` });
            }
            existingItem.quantity = newQuantity;
        } else {
            cart.items.push({ product: productId, quantity });
        }

        await cart.save();
        const populated = await cart.populate('items.product');
        res.json(populated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// PUT /api/cart/:productId — update quantity
export const updateCartItem = async (req, res) => {
    try {
        const { quantity } = req.body;
        
        // Validate ObjectId format
        if (!req.params.productId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: 'Invalid product ID format' });
        }
        
        // Validate quantity
        if (quantity < 0) {
            return res.status(400).json({ message: 'Quantity cannot be negative' });
        }
        
        const cart = await Cart.findOne({ user: req.user._id });

        if (!cart) return res.status(404).json({ message: 'Cart not found' });

        const item = cart.items.find(
            item => item.product.toString() === req.params.productId
        );

        if (!item) return res.status(404).json({ message: 'Item not in cart' });

        if (quantity <= 0) {
            cart.items = cart.items.filter(
                item => item.product.toString() !== req.params.productId
            );
        } else {
            // Validate stock availability
            const product = await Product.findById(req.params.productId);
            if (!product) {
                return res.status(404).json({ message: 'Product not found' });
            }
            if (quantity > product.stock) {
                return res.status(400).json({ message: `Only ${product.stock} items available in stock` });
            }
            item.quantity = quantity;
        }

        await cart.save();
        const populated = await cart.populate('items.product');
        res.json(populated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// DELETE /api/cart/:productId — remove item
export const removeFromCart = async (req, res) => {
    try {
        // Validate ObjectId format
        if (!req.params.productId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: 'Invalid product ID format' });
        }
        
        const cart = await Cart.findOne({ user: req.user._id });
        if (!cart) return res.status(404).json({ message: 'Cart not found' });

        cart.items = cart.items.filter(
            item => item.product.toString() !== req.params.productId
        );

        await cart.save();
        const populated = await cart.populate('items.product');
        res.json(populated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// DELETE /api/cart — clear cart
export const clearCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id });
        if (cart) {
            cart.items = [];
            await cart.save();
        }
        res.json({ message: 'Cart cleared' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
