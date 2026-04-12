import asyncHandler from '../../utils/asyncHandler.js';
import { successResponse } from '../../utils/ApiResponse.js';
import PageService from './page.service.js';

// GET /api/pages
export const getPages = asyncHandler(async (req, res) => {
    const pages = await PageService.getPages();
    successResponse(res, { statusCode: 200, data: pages, message: 'Pages fetched' });
});

// GET /api/pages/:slug
export const getPageBySlug = asyncHandler(async (req, res) => {
    const page = await PageService.getPageBySlug(req.params.slug);
    successResponse(res, { statusCode: 200, data: page, message: 'Page fetched' });
});

// POST /api/pages
export const createPage = asyncHandler(async (req, res) => {
    const page = await PageService.createPage(req.body);
    successResponse(res, { statusCode: 201, data: page, message: 'Page created' });
});

// PUT /api/pages/:id
export const updatePage = asyncHandler(async (req, res) => {
    const page = await PageService.updatePage(req.params.id, req.body);
    successResponse(res, { statusCode: 200, data: page, message: 'Page updated' });
});

// DELETE /api/pages/:id
export const deletePage = asyncHandler(async (req, res) => {
    await PageService.deletePage(req.params.id);
    successResponse(res, { statusCode: 200, data: null, message: 'Page deleted' });
});
