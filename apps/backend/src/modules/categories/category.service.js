import Category from './category.model.js';
import ApiError from '../../utils/ApiError.js';

class CategoryService {
    static async getCategories() {
        return Category.find().sort({ name: 1 });
    }

    static async getCategory(id) {
        const category = await Category.findById(id);
        if (!category) throw new ApiError(404, 'Category not found');
        return category;
    }

    static async createCategory(data) {
        return Category.create(data);
    }

    static async updateCategory(id, data) {
        const category = await Category.findByIdAndUpdate(id, data, { new: true, runValidators: true });
        if (!category) throw new ApiError(404, 'Category not found');
        return category;
    }

    static async deleteCategory(id) {
        const category = await Category.findByIdAndDelete(id);
        if (!category) throw new ApiError(404, 'Category not found');
    }
}

export default CategoryService;
