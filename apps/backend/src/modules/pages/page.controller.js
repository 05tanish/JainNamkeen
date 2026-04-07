import Page from './page.model.js';

// GET /api/pages
// Admin: Get all pages
export const getPages = async (req, res) => {
    try {
        const pages = await Page.find().sort({ createdAt: -1 });
        res.json(pages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/pages/:slug
// Public: Get an active page by unique slug
export const getPageBySlug = async (req, res) => {
    try {
        const page = await Page.findOne({ slug: req.params.slug, isActive: true });
        if (!page) return res.status(404).json({ message: 'Page not found' });
        res.json(page);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// POST /api/pages
// Admin: Create new page
export const createPage = async (req, res) => {
    try {
        const { title, slug, content, isActive } = req.body;

        const existing = await Page.findOne({ slug: slug.toLowerCase() });
        if (existing) return res.status(400).json({ message: 'Slug already exists' });

        const page = new Page({ title, slug, content, isActive });
        await page.save();
        res.status(201).json(page);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// PUT /api/pages/:id
// Admin: Update page
export const updatePage = async (req, res) => {
    try {
        const { title, slug, content, isActive } = req.body;
        const page = await Page.findById(req.params.id);
        if (!page) return res.status(404).json({ message: 'Page not found' });

        if (slug) {
            const existing = await Page.findOne({ slug: slug.toLowerCase(), _id: { $ne: page._id } });
            if (existing) return res.status(400).json({ message: 'Slug already exists' });
            page.slug = slug.toLowerCase();
        }

        if (title) page.title = title;
        if (content) page.content = content;
        if (isActive !== undefined) page.isActive = isActive;

        await page.save();
        res.json(page);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// DELETE /api/pages/:id
// Admin: Delete page
export const deletePage = async (req, res) => {
    try {
        const page = await Page.findById(req.params.id);
        if (!page) return res.status(404).json({ message: 'Page not found' });

        await Page.deleteOne({ _id: req.params.id });
        res.json({ message: 'Page deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
