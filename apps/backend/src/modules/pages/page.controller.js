import { asyncHandler } from '../../utils/asyncHandler.js';
import { successResponse } from '../../utils/ApiResponse.js';
import * as PageService from './page.service.js';

export const getPages = asyncHandler(async (req, res) => {
    const pages = await PageService.getPages();
    successResponse(res, { statusCode: 200, data: pages, message: 'Pages fetched' });
});

export const getPageBySlug = asyncHandler(async (req, res) => {
    const page = await PageService.getPageBySlug(req.params.slug);
    successResponse(res, { statusCode: 200, data: page, message: 'Page fetched' });
});

export const createPage = asyncHandler(async (req, res) => {
    const page = await PageService.createPage(req.body);
    successResponse(res, { statusCode: 201, data: page, message: 'Page created' });
});

export const updatePage = asyncHandler(async (req, res) => {
    const page = await PageService.updatePage(req.params.id, req.body);
    successResponse(res, { statusCode: 200, data: page, message: 'Page updated' });
});

export const deletePage = asyncHandler(async (req, res) => {
    await PageService.deletePage(req.params.id);
    successResponse(res, { statusCode: 200, data: null, message: 'Page deleted' });
});
