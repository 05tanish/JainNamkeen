import Banner from './banner.model.js';
import ApiError from '../../utils/ApiError.js';

class BannerService {
    static async createBanner(data, file) {
        const bannerData = { ...data };
        if (file) bannerData.image = `/uploads/${file.filename}`;
        return Banner.create(bannerData);
    }

    static async getBanners({ position, active } = {}) {
        const query = {};
        if (position) query.position = position;
        if (active !== undefined) query.isActive = active === 'true';
        return Banner.find(query).sort({ createdAt: -1 });
    }

    static async updateBanner(id, data, file) {
        const updates = { ...data };
        if (file) updates.image = `/uploads/${file.filename}`;
        const banner = await Banner.findByIdAndUpdate(id, updates, { new: true });
        if (!banner) throw new ApiError(404, 'Banner not found');
        return banner;
    }

    static async deleteBanner(id) {
        const banner = await Banner.findByIdAndDelete(id);
        if (!banner) throw new ApiError(404, 'Banner not found');
    }

    static async toggleBannerStatus(id) {
        const banner = await Banner.findById(id);
        if (!banner) throw new ApiError(404, 'Banner not found');
        banner.isActive = !banner.isActive;
        await banner.save();
        return banner;
    }
}

export default BannerService;
