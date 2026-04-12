import asyncHandler from '../../utils/asyncHandler.js';
import { successResponse } from '../../utils/ApiResponse.js';
import ProductService from './product.service.js';

// GET /api/products
export const getProducts = asyncHandler(async (req, res) => {
    const result = await ProductService.getProducts(req.query);
    successResponse(res, { statusCode: 200, data: result, message: 'Products fetched' });
});

// GET /api/products/trending
export const getTrending = asyncHandler(async (req, res) => {
    const products = await ProductService.getTrending();
    successResponse(res, { statusCode: 200, data: products, message: 'Trending products' });
});

// GET /api/products/suggest
export const getAutoSuggest = asyncHandler(async (req, res) => {
    const products = await ProductService.getAutoSuggest(req.query.q);
    successResponse(res, { statusCode: 200, data: products, message: 'Suggestions' });
});

// GET /api/products/tags
export const getAllTags = asyncHandler(async (req, res) => {
    const tags = await ProductService.getAllTags();
    successResponse(res, { statusCode: 200, data: tags, message: 'Tags fetched' });
});

// GET /api/products/all (admin)
export const getAllProducts = asyncHandler(async (req, res) => {
    const products = await ProductService.getAllProducts();
    successResponse(res, { statusCode: 200, data: products, message: 'All products fetched' });
});

// GET /api/products/:id
export const getProduct = asyncHandler(async (req, res) => {
    const product = await ProductService.getProduct(req.params.id);
    successResponse(res, { statusCode: 200, data: product, message: 'Product fetched' });
});

// POST /api/products
export const createProduct = asyncHandler(async (req, res) => {
    const product = await ProductService.createProduct(req.body);
    successResponse(res, { statusCode: 201, data: product, message: 'Product created' });
});

// PUT /api/products/:id
export const updateProduct = asyncHandler(async (req, res) => {
    const product = await ProductService.updateProduct(req.params.id, req.body);
    successResponse(res, { statusCode: 200, data: product, message: 'Product updated' });
});

// DELETE /api/products/:id
export const deleteProduct = asyncHandler(async (req, res) => {
    await ProductService.deleteProduct(req.params.id);
    successResponse(res, { statusCode: 200, data: null, message: 'Product deleted' });
});

// PUT /api/products/:id/status
export const toggleProductStatus = asyncHandler(async (req, res) => {
    const product = await ProductService.toggleProductStatus(req.params.id);
    successResponse(res, { statusCode: 200, data: product, message: `Product ${product.isActive ? 'activated' : 'deactivated'}` });
});

// POST /api/products/upload-images
export const uploadImages = asyncHandler(async (req, res) => {
    const images = await ProductService.uploadImages(req.files);
    successResponse(res, { statusCode: 200, data: { images }, message: 'Images uploaded' });
});

// POST /api/products/remove-image
export const removeImage = asyncHandler(async (req, res) => {
    await ProductService.removeImage(req.body.public_id);
    successResponse(res, { statusCode: 200, data: null, message: 'Image removed' });
});
