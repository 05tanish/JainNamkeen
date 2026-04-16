import Product from './product.model.js';
import { v2 as cloudinary } from 'cloudinary';
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
        if (pageNum < 1) throw new ApiError(400, 'Page must be >= 1');
        if (limitNum < 1 || limitNum > 100) throw new ApiError(400, 'Limit must be between 1 and 100');

        const query = { isActive: true };
        if (category) query.category = category;
        if (featured === 'true') query.isFeatured = true;
        if (brand) query.brand = { $regex: brand, $options: 'i' };
        if (tag) query.tags = { $in: [tag.toLowerCase()] };
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }
        if (weight) query.weight = { $regex: weight, $options: 'i' };
        if (search) {
            const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const fuzzy = escaped.split('').join('.*?');
            query.$or = [
                { name: new RegExp(fuzzy, 'i') },
                { description: new RegExp(fuzzy, 'i') },
                { tags: { $in: [new RegExp(escaped, 'i')] } },
            ];
        }

        const sortMap = {
            price_asc: { price: 1 },
            price_desc: { price: -1 },
            popular: { totalSold: -1 },
            newest: { createdAt: -1 },
            name_asc: { name: 1 },
        };
        const sortOption = sortMap[sort] ?? { createdAt: -1 };

        const [total, products] = await Promise.all([
            Product.countDocuments(query),
            Product.find(query)
                .populate('category', 'name')
                .sort(sortOption)
                .skip((pageNum - 1) * limitNum)
                .limit(limitNum),
        ]);

        return { products, total, page: pageNum, pages: Math.ceil(total / limitNum) };
    }

    static async getTrending() {
        return Product.find({ isActive: true, totalSold: { $gt: 0 } })
            .populate('category', 'name')
            .sort({ totalSold: -1 })
            .limit(8);
    }

    static async getAutoSuggest(q) {
        if (!q || q.length < 2) return [];
        const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return Product.find(
            { isActive: true, name: new RegExp(escaped, 'i') },
            { name: 1, price: 1, weight: 1, images: 1, category: 1 }
        )
            .populate('category', 'name')
            .limit(8);
    }

    static async getAllTags() {
        const tags = await Product.distinct('tags', { isActive: true });
        return tags.sort();
    }

    static async getAllProducts() {
        return Product.find().populate('category', 'name').sort({ createdAt: -1 });
    }

    static async getProduct(id) {
        if (!id.match(/^[0-9a-fA-F]{24}$/)) throw new ApiError(400, 'Invalid product ID');
        const product = await Product.findById(id).populate('category', 'name');
        if (!product) throw new ApiError(404, 'Product not found');
        return product;
    }

    static async createProduct(body) {
        const productData = { ...body };
        if (typeof productData.tags === 'string') {
            productData.tags = productData.tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
        }
        const product = await Product.create(productData);
        return product.populate('category', 'name');
    }

    static async updateProduct(id, body) {
        if (!id.match(/^[0-9a-fA-F]{24}$/)) throw new ApiError(400, 'Invalid product ID');
        const productData = { ...body };
        if (typeof productData.tags === 'string') {
            productData.tags = productData.tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
        }
        const product = await Product.findByIdAndUpdate(id, productData, {
            new: true,
            runValidators: true,
        }).populate('category', 'name');
        if (!product) throw new ApiError(404, 'Product not found');
        return product;
    }

    static async deleteProduct(id) {
        if (!id.match(/^[0-9a-fA-F]{24}$/)) throw new ApiError(400, 'Invalid product ID');
        const product = await Product.findByIdAndDelete(id);
        if (!product) throw new ApiError(404, 'Product not found');
    }

    static async toggleProductStatus(id) {
        if (!id.match(/^[0-9a-fA-F]{24}$/)) throw new ApiError(400, 'Invalid product ID');
        const product = await Product.findById(id);
        if (!product) throw new ApiError(404, 'Product not found');
        product.isActive = !product.isActive;
        await product.save();
        return product;
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
