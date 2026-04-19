import Banner from './banner.model.js';
import { ApiError } from '../../utils/ApiError.js';


export const createBanner = async (data, file) => {
        const bannerData = { ...data };
        if (file) bannerData.image = `/uploads/${file.filename}`;
        return Banner.create(bannerData);
    }

export const getBanners = async ({ position, active } = {}) => {
        const query = {};
        if (position) query.position = position;
        if (active !== undefined) query.isActive = active === 'true';
        return Banner.find(query).sort({ createdAt: -1 });
    }

export const updateBanner = async (id, data, file) => {
        const updates = { ...data };
        if (file) updates.image = `/uploads/${file.filename}`;
        const banner = await Banner.findByIdAndUpdate(id, updates, { new: true });
        if (!banner) throw new ApiError(404, 'Banner not found');
        return banner;
    }

export const deleteBanner = async (id) => {
        const banner = await Banner.findByIdAndDelete(id);
        if (!banner) throw new ApiError(404, 'Banner not found');
    }

export const toggleBannerStatus = async (id) => {
        const banner = await Banner.findById(id);
        if (!banner) throw new ApiError(404, 'Banner not found');
        banner.isActive = !banner.isActive;
        await banner.save();
        return banner;
};
