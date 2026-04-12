import Page from './page.model.js';
import ApiError from '../../utils/ApiError.js';

class PageService {
    static async getPages() {
        return Page.find().sort({ createdAt: -1 });
    }

    static async getPageBySlug(slug) {
        const page = await Page.findOne({ slug, isActive: true });
        if (!page) throw new ApiError(404, 'Page not found');
        return page;
    }

    static async createPage({ title, slug, content, isActive }) {
        if (!slug) throw new ApiError(400, 'Slug is required');
        const normalizedSlug = slug.toLowerCase();
        const existing = await Page.findOne({ slug: normalizedSlug });
        if (existing) throw new ApiError(409, 'A page with this slug already exists');
        return Page.create({ title, slug: normalizedSlug, content, isActive });
    }

    static async updatePage(id, { title, slug, content, isActive }) {
        const page = await Page.findById(id);
        if (!page) throw new ApiError(404, 'Page not found');
        if (slug) {
            const normalizedSlug = slug.toLowerCase();
            const existing = await Page.findOne({ slug: normalizedSlug, _id: { $ne: page._id } });
            if (existing) throw new ApiError(409, 'A page with this slug already exists');
            page.slug = normalizedSlug;
        }
        if (title !== undefined) page.title = title;
        if (content !== undefined) page.content = content;
        if (isActive !== undefined) page.isActive = isActive;
        await page.save();
        return page;
    }

    static async deletePage(id) {
        const page = await Page.findById(id);
        if (!page) throw new ApiError(404, 'Page not found');
        await Page.deleteOne({ _id: id });
    }
}

export default PageService;
