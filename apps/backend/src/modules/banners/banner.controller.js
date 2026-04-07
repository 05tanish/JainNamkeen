import Banner from './banner.model.js';

// POST /api/banners
export const createBanner = async (req, res) => {
    try {
        const banner = new Banner(req.body);
        if (req.file) banner.image = `/uploads/${req.file.filename}`;
        await banner.save();
        res.status(201).json(banner);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/banners
export const getBanners = async (req, res) => {
    try {
        const { position, active } = req.query;
        const query = {};
        if (position) query.position = position;
        if (active !== undefined) query.isActive = active === 'true';
        const banners = await Banner.find(query).sort({ createdAt: -1 });
        res.json(banners);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// PUT /api/banners/:id
export const updateBanner = async (req, res) => {
    try {
        const updates = { ...req.body };
        if (req.file) updates.image = `/uploads/${req.file.filename}`;
        const banner = await Banner.findByIdAndUpdate(req.params.id, updates, { new: true });
        if (!banner) return res.status(404).json({ message: 'Banner not found' });
        res.json(banner);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// DELETE /api/banners/:id
export const deleteBanner = async (req, res) => {
    try {
        const banner = await Banner.findByIdAndDelete(req.params.id);
        if (!banner) return res.status(404).json({ message: 'Banner not found' });
        res.json({ message: 'Banner deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// PUT /api/banners/:id/toggle
export const toggleBannerStatus = async (req, res) => {
    try {
        const banner = await Banner.findById(req.params.id);
        if (!banner) return res.status(404).json({ message: 'Banner not found' });
        banner.isActive = !banner.isActive;
        await banner.save();
        res.json(banner);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
