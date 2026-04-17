import { prisma } from '../../config/Postgrsedb.js';
import { ApiError } from '../../utils/ApiError.js';

export const getCategories = async () => {
    return prisma.category.findMany({
        orderBy: { name: 'asc' }
    });
};

export const getCategory = async (id) => {
    const category = await prisma.category.findUnique({
        where: { id }
    });

    if (!category) throw new ApiError(404, 'Category not found');
    return category;
};

export const createCategory = async (data) => {
    return prisma.category.create({
        data
    });
};

export const updateCategory = async (id, data) => {
    const category = await prisma.category.update({
        where: { id },
        data
    }).catch(() => {
        throw new ApiError(404, 'Category not found');
    });

    return category;
};

export const deleteCategory = async (id) => {
    await prisma.category.delete({
        where: { id }
    }).catch(() => {
        throw new ApiError(404, 'Category not found');
    });
};
