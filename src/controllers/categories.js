import {
    getAllCategories,
    getCategoryDetails,
    getProjectsByCategoryId
} from '../models/categories.js';

const showCategoriesPage = async (req, res) => {
    const categories = await getAllCategories();
    res.render('categories', { title: 'Service Project Categories', categories });
};

const showCategoryDetailsPage = async (req, res) => {
    const categoryId = req.params.id;
    if (!/^\d+$/.test(categoryId)) {
        const error = new Error('Category not found.');
        error.status = 404;
        throw error;
    }

    const categoryDetails = await getCategoryDetails(categoryId);
    if (!categoryDetails) {
        const error = new Error('Category not found.');
        error.status = 404;
        throw error;
    }

    const projects = await getProjectsByCategoryId(categoryId);
    res.render('category', {
        title: categoryDetails.name,
        categoryDetails,
        projects
    });
};

export { showCategoriesPage, showCategoryDetailsPage };
