import { prisma } from '../../config/Postgrsedb.js';
import { ApiError } from '../../utils/ApiError.js';

const MAX_CART_ITEMS = 50; // Prevent cart abuse
const MAX_ITEM_QUANTITY = 99; // Maximum quantity per item

// Shared include shape for all cart returns
const cartInclude = {
    items: {
        include: {
            product: true,
            variant: { select: { id: true, weightLabel: true, price: true, stock: true } }
        }
    }
};

export const getCart = async (userId) => {
    let cart = await prisma.cart.findUnique({
        where: { userId },
        include: cartInclude
    });

    if (!cart) {
        cart = await prisma.cart.create({
            data: { userId },
            include: cartInclude
        });
    }

    return cart;
};

export const addToCart = async (userId, { productId, variantId, quantity = 1 }) => {
    const qty = parseInt(quantity);
    if (qty < 1) throw new ApiError(400, 'Quantity must be at least 1');
    if (qty > MAX_ITEM_QUANTITY) throw new ApiError(400, `Maximum quantity per item is ${MAX_ITEM_QUANTITY}`);

    return await prisma.$transaction(async (tx) => {
        let priceSnapshot;

        if (variantId) {
            // Lock variant row to prevent concurrent stock over-read
            const rows = await tx.$queryRaw`
                SELECT id, stock, price FROM weight_variants WHERE id = ${variantId} FOR UPDATE
            `;
            const variant = rows[0];
            if (!variant) throw new ApiError(404, 'Variant not found');
            if (variant.stock === 0) throw new ApiError(400, `Variant is out of stock`);
            if (qty > variant.stock) throw new ApiError(400, `Only ${variant.stock} items available for this variant`);
            priceSnapshot = variant.price;
        } else {
            // Legacy path: lock product row
            const rows = await tx.$queryRaw`
                SELECT id, "isActive", stock, price FROM products WHERE id = ${productId} FOR UPDATE
            `;
            const product = rows[0];
            if (!product) throw new ApiError(404, 'Product not found');
            if (!product.isActive) throw new ApiError(400, 'Product is not available');
            if (qty > product.stock) throw new ApiError(400, `Only ${product.stock} items available in stock`);
            priceSnapshot = product.price;
        }

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

        const existingItem = cart.items.find(
            i => i.productId === productId && i.variantId === (variantId ?? null)
        );

        if (existingItem) {
            const newQty = existingItem.quantity + qty;
            if (newQty > MAX_ITEM_QUANTITY) {
                throw new ApiError(400, `Maximum quantity per item is ${MAX_ITEM_QUANTITY}`);
            }

            // Re-check stock for accumulated quantity
            if (variantId) {
                const rows = await tx.$queryRaw`
                    SELECT stock FROM weight_variants WHERE id = ${variantId}
                `;
                const variant = rows[0];
                if (newQty > variant.stock) {
                    throw new ApiError(400, `Only ${variant.stock} items available for this variant`);
                }
            } else {
                const rows = await tx.$queryRaw`
                    SELECT stock FROM products WHERE id = ${productId}
                `;
                const product = rows[0];
                if (newQty > product.stock) {
                    throw new ApiError(400, `Only ${product.stock} items available in stock`);
                }
            }

            await tx.cartItem.update({
                where: { id: existingItem.id },
                data: { quantity: newQty, priceSnapshot }
            });
        } else {
            await tx.cartItem.create({
                data: {
                    cartId: cart.id,
                    productId,
                    variantId: variantId ?? null,
                    quantity: qty,
                    priceSnapshot
                }
            });
        }

        return tx.cart.findUnique({
            where: { userId },
            include: cartInclude
        });
    });
};

export const updateCartItem = async (userId, productId, variantId, quantity) => {
    const qty = parseInt(quantity);

    return await prisma.$transaction(async (tx) => {
        const cart = await tx.cart.findUnique({
            where: { userId },
            include: { items: true }
        });

        if (!cart) throw new ApiError(404, 'Cart not found');

        const item = cart.items.find(
            i => i.productId === productId && i.variantId === (variantId ?? null)
        );
        if (!item) throw new ApiError(404, 'Item not in cart');

        if (qty <= 0) {
            await tx.cartItem.delete({ where: { id: item.id } });
        } else {
            if (qty > MAX_ITEM_QUANTITY) {
                throw new ApiError(400, `Maximum quantity per item is ${MAX_ITEM_QUANTITY}`);
            }

            let priceSnapshot;

            if (variantId) {
                // Lock variant row before checking stock
                const rows = await tx.$queryRaw`
                    SELECT id, stock, price FROM weight_variants WHERE id = ${variantId} FOR UPDATE
                `;
                const variant = rows[0];
                if (!variant) throw new ApiError(404, 'Variant not found');
                if (qty > variant.stock) {
                    throw new ApiError(400, `Only ${variant.stock} items available for this variant`);
                }
                priceSnapshot = variant.price;
            } else {
                // Legacy path: lock product row
                const productRows = await tx.$queryRaw`
                    SELECT id, stock, price FROM products WHERE id = ${productId} FOR UPDATE
                `;
                const product = productRows[0];
                if (!product) throw new ApiError(404, 'Product not found');
                if (qty > product.stock) {
                    throw new ApiError(400, `Only ${product.stock} items available in stock`);
                }
                priceSnapshot = product.price;
            }

            await tx.cartItem.update({
                where: { id: item.id },
                data: { quantity: qty, priceSnapshot }
            });
        }

        return tx.cart.findUnique({
            where: { userId },
            include: cartInclude
        });
    });
};

export const removeFromCart = async (userId, productId, variantId) => {
    const cart = await prisma.cart.findUnique({
        where: { userId },
        include: { items: true }
    });

    if (!cart) throw new ApiError(404, 'Cart not found');

    const item = cart.items.find(
        i => i.productId === productId && i.variantId === (variantId ?? null)
    );
    if (item) {
        await prisma.cartItem.delete({ where: { id: item.id } });
    }

    return prisma.cart.findUnique({
        where: { userId },
        include: cartInclude
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
