import Product from './product.model.js';
import { v2 as cloudinary } from 'cloudinary';

// GET /api/products — with advanced filters & sorting
export const getProducts = async (req, res) => {
    try {
        const {
            category, search, featured, tag, brand,
            minPrice, maxPrice, weight,
            sort = 'newest',
            page = 1, limit = 20
        } = req.query;

        const query = { isActive: true };

        // Category filter
        if (category) query.category = category;

        // Featured filter
        if (featured === 'true') query.isFeatured = true;

        // Brand filter
        if (brand) query.brand = { $regex: brand, $options: 'i' };

        // Tag filter
        if (tag) query.tags = { $in: [tag.toLowerCase()] };

        // Price range filter
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }

        // Weight filter
        if (weight) query.weight = { $regex: weight, $options: 'i' };

        // Search with typo tolerance (relaxed regex)
        if (search) {
            // Build a fuzzy regex: insert optional wildcards between characters
            const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const fuzzy = escaped.split('').join('.*?');
            const searchRegex = new RegExp(fuzzy, 'i');

            query.$or = [
                { name: searchRegex },
                { description: searchRegex },
                { tags: { $in: [new RegExp(escaped, 'i')] } }
            ];
        }

        // Sorting
        let sortOption = { createdAt: -1 }; // default: newest
        switch (sort) {
            case 'price_asc': sortOption = { price: 1 }; break;
            case 'price_desc': sortOption = { price: -1 }; break;
            case 'popular': sortOption = { totalSold: -1 }; break;
            case 'newest': sortOption = { createdAt: -1 }; break;
            case 'name_asc': sortOption = { name: 1 }; break;
        }

        const total = await Product.countDocuments(query);
        const products = await Product.find(query)
            .populate('category', 'name')
            .sort(sortOption)
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        res.json({ products, total, page: parseInt(page), pages: Math.ceil(total / limit) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/products/trending — top products by sales
export const getTrending = async (req, res) => {
    try {
        const products = await Product.find({ isActive: true, totalSold: { $gt: 0 } })
            .populate('category', 'name')
            .sort({ totalSold: -1 })
            .limit(8);
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/products/suggest?q=... — auto-suggest for search
export const getAutoSuggest = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.length < 2) return res.json([]);

        const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escaped, 'i');

        const products = await Product.find(
            { isActive: true, name: regex },
            { name: 1, price: 1, weight: 1, images: 1, category: 1 }
        )
            .populate('category', 'name')
            .limit(8);

        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/products/tags — get all unique tags
export const getAllTags = async (req, res) => {
    try {
        const tags = await Product.distinct('tags', { isActive: true });
        res.json(tags.sort());
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/products/all (admin/staff — includes inactive)
export const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find()
            .populate('category', 'name')
            .sort({ createdAt: -1 });
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/products/:id
export const getProduct = async (req, res) => {
    try {
        // Validate ObjectId format
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: 'Invalid product ID format' });
        }
        
        const product = await Product.findById(req.params.id).populate('category', 'name');
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// POST /api/products
export const createProduct = async (req, res) => {
    try {
        const productData = { ...req.body };
        
        // Handle images array instead of singular req.file
        if (req.body.images) {
            productData.images = req.body.images; // array of urls
        }
        
        // Parse tags if sent as comma-separated string
        if (typeof productData.tags === 'string') {
            productData.tags = productData.tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
        }

        const product = await Product.create(productData);
        const populated = await product.populate('category', 'name');
        res.status(201).json(populated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// PUT /api/products/:id
export const updateProduct = async (req, res) => {
    try {
        // Validate ObjectId format
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: 'Invalid product ID format' });
        }
        
        const productData = { ...req.body };
        
        // Update images if provided
        if (req.body.images) {
            productData.images = req.body.images;
        }

        // Parse tags if sent as comma-separated string
        if (typeof productData.tags === 'string') {
            productData.tags = productData.tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
        }

        const product = await Product.findByIdAndUpdate(req.params.id, productData, {
            new: true,
            runValidators: true
        }).populate('category', 'name');

        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// DELETE /api/products/:id
export const deleteProduct = async (req, res) => {
    try {
        // Validate ObjectId format
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: 'Invalid product ID format' });
        }
        
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json({ message: 'Product deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// PUT /api/products/:id/status — toggle product active status (admin)
export const toggleProductStatus = async (req, res) => {
    try {
        // Validate ObjectId format
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: 'Invalid product ID format' });
        }
        
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });

        product.isActive = !product.isActive;
        await product.save();
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// POST /api/products/upload-images
export const uploadImages = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No images uploaded' });
        }
        
        const uploadedImages = req.files.map(file => ({
            url: file.path, 
            public_id: file.filename
        }));
        
        res.status(200).json({ images: uploadedImages });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// POST /api/products/remove-image
export const removeImage = async (req, res) => {
    try {
        const { public_id } = req.body;
        if (!public_id) {
            return res.status(400).json({ message: 'No public_id provided' });
        }
        
        // Remove from cloudinary
        await cloudinary.uploader.destroy(public_id);
        
        res.status(200).json({ message: 'Image deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
