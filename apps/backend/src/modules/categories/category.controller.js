import { asyncHandler } from '../../utils/asyncHandler.js';
import { successResponse } from '../../utils/ApiResponse.js';
import * as CategoryService from './category.service.js';

export const getCategories = asyncHandler(async (req, res) => {
    const categories = await CategoryService.getCategories();
    successResponse(res, { statusCode: 200, data: categories, message: 'Categories fetched' });
});

export const getCategory = asyncHandler(async (req, res) => {
    const category = await CategoryService.getCategory(req.params.id);
    successResponse(res, { statusCode: 200, data: category, message: 'Category fetched' });
});

export const createCategory = asyncHandler(async (req, res) => {
    const category = await CategoryService.createCategory(req.body);
    successResponse(res, { statusCode: 201, data: category, message: 'Category created' });
});

export const updateCategory = asyncHandler(async (req, res) => {
    const category = await CategoryService.updateCategory(req.params.id, req.body);
    successResponse(res, { statusCode: 200, data: category, message: 'Category updated' });
});

export const deleteCategory = asyncHandler(async (req, res) => {
    await CategoryService.deleteCategory(req.params.id);
    successResponse(res, { statusCode: 200, data: null, message: 'Category deleted' });
});
