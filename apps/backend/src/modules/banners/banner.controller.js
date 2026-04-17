import { asyncHandler } from '../../utils/asyncHandler.js';
import { successResponse } from '../../utils/ApiResponse.js';
import * as BannerService from './banner.service.js';

export const createBanner = asyncHandler(async (req, res) => {
    const banner = await BannerService.createBanner(req.body, req.file);
    successResponse(res, { statusCode: 201, data: banner, message: 'Banner created' });
});

export const getBanners = asyncHandler(async (req, res) => {
    const banners = await BannerService.getBanners(req.query);
    successResponse(res, { statusCode: 200, data: banners, message: 'Banners fetched' });
});

export const updateBanner = asyncHandler(async (req, res) => {
    const banner = await BannerService.updateBanner(req.params.id, req.body, req.file);
    successResponse(res, { statusCode: 200, data: banner, message: 'Banner updated' });
});

export const deleteBanner = asyncHandler(async (req, res) => {
    await BannerService.deleteBanner(req.params.id);
    successResponse(res, { statusCode: 200, data: null, message: 'Banner deleted' });
});

export const toggleBannerStatus = asyncHandler(async (req, res) => {
    const banner = await BannerService.toggleBannerStatus(req.params.id);
    successResponse(res, { statusCode: 200, data: banner, message: `Banner ${banner.isActive ? 'activated' : 'deactivated'}` });
});
