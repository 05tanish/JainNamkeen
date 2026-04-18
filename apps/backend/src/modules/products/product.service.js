import { prisma } from '../../config/Postgrsedb.js';
import { cloudinary } from '../../config/cloudinary.js';
import { ApiError } from '../../utils/ApiError.js';

const VALID_SORTS = ['newest', 'price_asc', 'price_desc', 'popular', 'name_asc'];

class ProductService {
    static async getProducts(filters) {
        const {
            category, search, featured, tag, brand,
            minPrice, maxPrice, weight,
            sort = 'newest',
            page = 1, limit = 20,
        } = filters;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        if (isNaN(pageNum) || pageNum < 1) throw new ApiError(400, 'Page must be a valid number >= 1');
        if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) throw new ApiError(400, 'Limit must be between 1 and 100');

        const where = { isActive: true };
        
        if (category) where.categoryId = category;
        if (featured === 'true') where.isFeatured = true;
        if (brand) where.brand = { contains: brand, mode: 'insensitive' };
        if (tag) where.tags = { has: tag.toLowerCase() };
        if (minPrice || maxPrice) {
            where.price = {};
            if (minPrice) where.price.gte = Number(minPrice);
            if (maxPrice) where.price.lte = Number(maxPrice);
        }
        if (weight) where.weight = { contains: weight, mode: 'insensitive' };
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { tags: { has: search.toLowerCase() } }
            ];
        }

        const orderByMap = {
            price_asc: { price: 'asc' },
            price_desc: { price: 'desc' },
            popular: { totalSold: 'desc' },
            newest: { createdAt: 'desc' },
            name_asc: { name: 'asc' },
        };
        const orderBy = orderByMap[sort] ?? { createdAt: 'desc' };

        const [total, products] = await Promise.all([
            prisma.product.count({ where }),
            prisma.product.findMany({
                where,
                include: { category: { select: { id: true, name: true } } },
                orderBy,
                skip: (pageNum - 1) * limitNum,
                take: limitNum
            })
        ]);

        const parseImages = (imgs) => {
            let parsed = imgs;
            while (typeof parsed === 'string') {
                try { parsed = JSON.parse(parsed); } catch(e) { break; }
            }
            return Array.isArray(parsed) ? parsed : [];
        };

        const mappedProducts = products.map(p => ({
            ...p,
            images: parseImages(p.images)
        }));

        return { products: mappedProducts, total, page: pageNum, pages: Math.ceil(total / limitNum) };
    }

    static async getTrending() {
        const products = await prisma.product.findMany({
            where: {
                isActive: true,
                totalSold: { gt: 0 }
            },
            include: { category: { select: { id: true, name: true } } },
            orderBy: { totalSold: 'desc' },
            take: 8
        });
        return products.map(p => ({
            ...p,
            images: (() => {
            let parsed = p.images;
            while (typeof parsed === 'string') {
                try { parsed = JSON.parse(parsed); } catch(e) { break; }
            }
            return Array.isArray(parsed) ? parsed : [];
        })()
        }));
    }

    static async getAutoSuggest(q) {
        if (!q || q.length < 2) return [];
        
        const products = await prisma.product.findMany({
            where: {
                isActive: true,
                name: { contains: q, mode: 'insensitive' }
            },
            select: {
                id: true,
                name: true,
                price: true,
                weight: true,
                images: true,
                category: { select: { name: true } }
            },
            take: 8
        });
        return products.map(p => ({
            ...p,
            images: (() => {
            let parsed = p.images;
            while (typeof parsed === 'string') {
                try { parsed = JSON.parse(parsed); } catch(e) { break; }
            }
            return Array.isArray(parsed) ? parsed : [];
        })()
        }));
    }

    static async getAllTags() {
        const products = await prisma.product.findMany({
            where: { isActive: true },
            select: { tags: true }
        });

        const tagsSet = new Set();
        products.forEach(p => p.tags.forEach(tag => tagsSet.add(tag)));
        return Array.from(tagsSet).sort();
    }

    static async getAllProducts() {
        const toNum = (d) => (d ? Number(d.toString()) : 0);
        const products = await prisma.product.findMany({
            include: { category: { select: { id: true, name: true } } },
            orderBy: { createdAt: 'desc' }
        });
        return products.map(p => {
            let parsedImages = p.images;
            while (typeof parsedImages === 'string') {
                try { parsedImages = JSON.parse(parsedImages); } catch(e) { break; }
            }
            if (!Array.isArray(parsedImages)) parsedImages = [];
            
            return {
                ...p,
                images: parsedImages,
                price:         toNum(p.price),
                costPrice:     toNum(p.costPrice),
                flashSalePrice: p.flashSalePrice ? toNum(p.flashSalePrice) : null,
            };
        });
    }

    static async getProduct(id) {
        const product = await prisma.product.findUnique({
            where: { id },
            include: { category: { select: { id: true, name: true } } }
        });

        if (!product) throw new ApiError(404, 'Product not found');
        
        while (typeof product.images === 'string') {
            try { product.images = JSON.parse(product.images); } catch(e) { break; }
        }
        if (!Array.isArray(product.images)) product.images = [];
            
        return product;
    }

    static async createProduct(body) {
        const productData = { ...body };
        
        // Schema sends 'category' but Prisma model uses 'categoryId'
        if (productData.category) {
            productData.categoryId = productData.category;
            delete productData.category;
        }

        if (typeof productData.tags === 'string') {
            productData.tags = productData.tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
        }

        const product = await prisma.product.create({
            data: productData,
            include: { category: { select: { id: true, name: true } } }
        });

        return product;
    }

    static async updateProduct(id, body) {
        const productData = { ...body };
        
        // Schema sends 'category' but Prisma model uses 'categoryId'
        if (productData.category) {
            productData.categoryId = productData.category;
            delete productData.category;
        }

        if (typeof productData.tags === 'string') {
            productData.tags = productData.tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
        }

        const product = await prisma.product.update({
            where: { id },
            data: productData,
            include: { category: { select: { id: true, name: true } } }
        }).catch((err) => {
            if (err.code === 'P2025') throw new ApiError(404, 'Product not found');
            throw err;
        });

        return product;
    }

    static async deleteProduct(id) {
        await prisma.product.delete({
            where: { id }
        }).catch((err) => {
            if (err.code === 'P2025') throw new ApiError(404, 'Product not found');
            throw err;
        });
    }

    static async toggleProductStatus(id) {
        const product = await prisma.product.findUnique({
            where: { id }
        });

        if (!product) throw new ApiError(404, 'Product not found');

        return prisma.product.update({
            where: { id },
            data: { isActive: !product.isActive }
        });
    }

    static async uploadImages(files) {
        if (!files || files.length === 0) throw new ApiError(400, 'No images uploaded');
        return files.map(file => ({ url: file.path, public_id: file.filename }));
    }

    static async removeImage(publicId) {
        if (!publicId) throw new ApiError(400, 'public_id is required');
        await cloudinary.uploader.destroy(publicId);
    }
}

export default ProductService;
