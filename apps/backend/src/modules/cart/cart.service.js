import { prisma } from '../../config/Postgrsedb.js';
import { ApiError } from '../../utils/ApiError.js';

export const getCart = async (userId) => {
    let cart = await prisma.cart.findUnique({
        where: { userId },
        include: {
            items: {
                include: {
                    product: true
                }
            }
        }
    });

    if (!cart) {
        cart = await prisma.cart.create({
            data: { userId },
            include: {
                items: {
                    include: {
                        product: true
                    }
                }
            }
        });
    }

    return cart;
};

export const addToCart = async (userId, { productId, quantity = 1 }) => {
    const product = await prisma.product.findUnique({
        where: { id: productId }
    });

    if (!product) throw new ApiError(404, 'Product not found');
    if (!product.isActive) throw new ApiError(400, 'Product is not available');

    const qty = parseInt(quantity);
    if (qty < 1) throw new ApiError(400, 'Quantity must be at least 1');

    let cart = await prisma.cart.findUnique({
        where: { userId },
        include: { items: true }
    });

    if (!cart) {
        cart = await prisma.cart.create({
            data: { userId },
            include: { items: true }
        });
    }

    const existingItem = cart.items.find(item => item.productId === productId);

    if (existingItem) {
        const newQty = existingItem.quantity + qty;
        if (newQty > product.stock) {
            throw new ApiError(400, `Only ${product.stock} items available in stock`);
        }

        await prisma.cartItem.update({
            where: { id: existingItem.id },
            data: { quantity: newQty }
        });
    } else {
        if (qty > product.stock) {
            throw new ApiError(400, `Only ${product.stock} items available in stock`);
        }

        await prisma.cartItem.create({
            data: {
                cartId: cart.id,
                productId,
                quantity: qty
            }
        });
    }

    return prisma.cart.findUnique({
        where: { userId },
        include: {
            items: {
                include: {
                    product: true
                }
            }
        }
    });
};

export const updateCartItem = async (userId, productId, quantity) => {
    const cart = await prisma.cart.findUnique({
        where: { userId },
        include: { items: true }
    });

    if (!cart) throw new ApiError(404, 'Cart not found');

    const item = cart.items.find(i => i.productId === productId);
    if (!item) throw new ApiError(404, 'Item not in cart');

    const qty = parseInt(quantity);

    if (qty <= 0) {
        await prisma.cartItem.delete({
            where: { id: item.id }
        });
    } else {
        const product = await prisma.product.findUnique({
            where: { id: productId }
        });

        if (!product) throw new ApiError(404, 'Product not found');
        if (qty > product.stock) {
            throw new ApiError(400, `Only ${product.stock} items available in stock`);
        }

        await prisma.cartItem.update({
            where: { id: item.id },
            data: { quantity: qty }
        });
    }

    return prisma.cart.findUnique({
        where: { userId },
        include: {
            items: {
                include: {
                    product: true
                }
            }
        }
    });
};

export const removeFromCart = async (userId, productId) => {
    const cart = await prisma.cart.findUnique({
        where: { userId },
        include: { items: true }
    });

    if (!cart) throw new ApiError(404, 'Cart not found');

    const item = cart.items.find(i => i.productId === productId);
    if (item) {
        await prisma.cartItem.delete({
            where: { id: item.id }
        });
    }

    return prisma.cart.findUnique({
        where: { userId },
        include: {
            items: {
                include: {
                    product: true
                }
            }
        }
    });
};

export const clearCart = async (userId) => {
    const cart = await prisma.cart.findUnique({
        where: { userId }
    });

    if (cart) {
        await prisma.cartItem.deleteMany({
            where: { cartId: cart.id }
        });
    }
};
