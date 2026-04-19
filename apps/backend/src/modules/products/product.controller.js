import { asyncHandler } from '../../utils/asyncHandler.js';
import { successResponse } from '../../utils/ApiResponse.js';
import * as ProductService from './product.service.js';

export const getProducts = asyncHandler(async (req, res) => {
    const result = await ProductService.getProducts(req.query);
    successResponse(res, { statusCode: 200, data: result, message: 'Products fetched' });
});

export const getTrending = asyncHandler(async (req, res) => {
    const products = await ProductService.getTrending();
    successResponse(res, { statusCode: 200, data: products, message: 'Trending products' });
});

export const getAutoSuggest = asyncHandler(async (req, res) => {
    const products = await ProductService.getAutoSuggest(req.query.q);
    successResponse(res, { statusCode: 200, data: products, message: 'Suggestions' });
});

export const getAllTags = asyncHandler(async (req, res) => {
    const tags = await ProductService.getAllTags();
    successResponse(res, { statusCode: 200, data: tags, message: 'Tags fetched' });
});

export const getAllProducts = asyncHandler(async (req, res) => {
    const products = await ProductService.getAllProducts();
    successResponse(res, { statusCode: 200, data: products, message: 'All products fetched' });
});

export const getProduct = asyncHandler(async (req, res) => {
    const product = await ProductService.getProduct(req.params.id);
    successResponse(res, { statusCode: 200, data: product, message: 'Product fetched' });
});

export const createProduct = asyncHandler(async (req, res) => {
    const product = await ProductService.createProduct(req.body);
    successResponse(res, { statusCode: 201, data: product, message: 'Product created' });
});

export const updateProduct = asyncHandler(async (req, res) => {
    const product = await ProductService.updateProduct(req.params.id, req.body);
    successResponse(res, { statusCode: 200, data: product, message: 'Product updated' });
});

export const deleteProduct = asyncHandler(async (req, res) => {
    await ProductService.deleteProduct(req.params.id);
    successResponse(res, { statusCode: 200, data: null, message: 'Product deleted' });
});

export const toggleProductStatus = asyncHandler(async (req, res) => {
    const product = await ProductService.toggleProductStatus(req.params.id);
    successResponse(res, { statusCode: 200, data: product, message: `Product ${product.isActive ? 'activated' : 'deactivated'}` });
});

export const uploadImages = asyncHandler(async (req, res) => {
    const images = await ProductService.uploadImages(req.files);
    successResponse(res, { statusCode: 200, data: { images }, message: 'Images uploaded' });
});

export const removeImage = asyncHandler(async (req, res) => {
    await ProductService.removeImage(req.body.public_id);
    successResponse(res, { statusCode: 200, data: null, message: 'Image removed' });
});

export const getVariants = asyncHandler(async (req, res) => {
    const variants = await ProductService.getVariants(req.params.id);
    successResponse(res, { statusCode: 200, data: variants, message: 'Variants fetched' });
});

export const createVariant = asyncHandler(async (req, res) => {
    const variant = await ProductService.createVariant(req.params.id, req.body);
    successResponse(res, { statusCode: 201, data: variant, message: 'Variant created' });
});

export const updateVariant = asyncHandler(async (req, res) => {
    const variant = await ProductService.updateVariant(req.params.id, req.params.variantId, req.body);
    successResponse(res, { statusCode: 200, data: variant, message: 'Variant updated' });
});

export const deleteVariant = asyncHandler(async (req, res) => {
    await ProductService.deleteVariant(req.params.id, req.params.variantId);
    successResponse(res, { statusCode: 200, data: null, message: 'Variant deleted' });
});

export const setDefaultVariant = asyncHandler(async (req, res) => {
    const variant = await ProductService.setDefaultVariant(req.params.id, req.params.variantId);
    successResponse(res, { statusCode: 200, data: variant, message: 'Default variant updated' });
});

export const migrateProduct = asyncHandler(async (req, res) => {
    const variant = await ProductService.migrateToVariants(req.params.id);
    successResponse(res, { statusCode: 201, data: variant, message: 'Product migrated to variants' });
});
