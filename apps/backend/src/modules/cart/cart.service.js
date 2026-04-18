import { prisma } from '../../config/Postgrsedb.js';
import { ApiError } from '../../utils/ApiError.js';

const MAX_CART_ITEMS = 50; // Prevent cart abuse
const MAX_ITEM_QUANTITY = 99; // Maximum quantity per item

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
    const qty = parseInt(quantity);
    if (qty < 1) throw new ApiError(400, 'Quantity must be at least 1');
    if (qty > MAX_ITEM_QUANTITY) throw new ApiError(400, `Maximum quantity per item is ${MAX_ITEM_QUANTITY}`);

    // Use transaction to ensure atomicity
    return await prisma.$transaction(async (tx) => {
        // Lock product row to prevent concurrent stock over-read during flash sales
        const rows = await tx.$queryRaw`
            SELECT id, "isActive", stock, price FROM products WHERE id = ${productId} FOR UPDATE
        `;
        const product = rows[0];

        if (!product) throw new ApiError(404, 'Product not found');
        if (!product.isActive) throw new ApiError(400, 'Product is not available');

        let cart = await tx.cart.findUnique({
            where: { userId },
            include: { items: true }
        });

        if (!cart) {
            cart = await tx.cart.create({
                data: { userId },
                include: { items: true }
            });
        }

        // Check cart size limit
        if (cart.items.length >= MAX_CART_ITEMS) {
            throw new ApiError(400, `Maximum ${MAX_CART_ITEMS} different items allowed in cart`);
        }

        const existingItem = cart.items.find(item => item.productId === productId);

        if (existingItem) {
            const newQty = existingItem.quantity + qty;
            if (newQty > MAX_ITEM_QUANTITY) {
                throw new ApiError(400, `Maximum quantity per item is ${MAX_ITEM_QUANTITY}`);
            }
            if (newQty > product.stock) {
                throw new ApiError(400, `Only ${product.stock} items available in stock`);
            }

            await tx.cartItem.update({
                where: { id: existingItem.id },
                data: { 
                    quantity: newQty,
                    // Store price snapshot to detect price changes
                    priceSnapshot: product.price
                }
            });
        } else {
            if (qty > product.stock) {
                throw new ApiError(400, `Only ${product.stock} items available in stock`);
            }

            await tx.cartItem.create({
                data: {
                    cartId: cart.id,
                    productId,
                    quantity: qty,
                    // Store price snapshot at time of adding to cart
                    priceSnapshot: product.price
                }
            });
        }

        return tx.cart.findUnique({
            where: { userId },
            include: {
                items: {
                    include: {
                        product: true
                    }
                }
            }
        });
    });
};

export const updateCartItem = async (userId, productId, quantity) => {
    const qty = parseInt(quantity);

    return await prisma.$transaction(async (tx) => {
        const cart = await tx.cart.findUnique({
            where: { userId },
            include: { items: true }
        });

        if (!cart) throw new ApiError(404, 'Cart not found');

        const item = cart.items.find(i => i.productId === productId);
        if (!item) throw new ApiError(404, 'Item not in cart');

        if (qty <= 0) {
            await tx.cartItem.delete({
                where: { id: item.id }
            });
        } else {
            if (qty > MAX_ITEM_QUANTITY) {
                throw new ApiError(400, `Maximum quantity per item is ${MAX_ITEM_QUANTITY}`);
            }

            // Lock product row before checking stock to prevent dirty reads
            const productRows = await tx.$queryRaw`
                SELECT id, stock, price FROM products WHERE id = ${productId} FOR UPDATE
            `;
            const product = productRows[0];

            if (!product) throw new ApiError(404, 'Product not found');
            if (qty > product.stock) {
                throw new ApiError(400, `Only ${product.stock} items available in stock`);
            }

            await tx.cartItem.update({
                where: { id: item.id },
                data: { 
                    quantity: qty,
                    priceSnapshot: product.price
                }
            });
        }

        return tx.cart.findUnique({
            where: { userId },
            include: {
                items: {
                    include: {
                        product: true
                    }
                }
            }
        });
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
