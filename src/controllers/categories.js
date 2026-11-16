import {
    getAllCategories,
    getCategoryDetails,
    getProjectsByCategoryId,
    createCategory,
    updateCategory
} from '../models/categories.js';
import { body, validationResult } from 'express-validator';
import { getProjectDetails } from '../models/projects.js';

const categoryValidation = [
    body('name').trim().notEmpty().withMessage('Category name is required.')
        .isLength({ min: 3, max: 100 }).withMessage('Category name must be between 3 and 100 characters.')
];

const categoryForm = (res, { title, category = {}, errors = [], status = 200 }) =>
    res.status(status).render(category.category_id ? 'edit-category' : 'new-category', { title, category, errors });

const showCategoriesPage = async (req, res) => {
    const categories = await getAllCategories();
    res.render('categories', { title: 'Service Project Categories', categories, success: req.query.success });
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
        projects,
        success: req.query.success
    });
};

const showNewCategoryForm = (req, res) => {
    const category = req.session.formData || {};
    delete req.session.formData;
    categoryForm(res, { title: 'Add a Category', category });
};

const processNewCategoryForm = async (req, res) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        req.session.formData = req.body;
        result.array().forEach(({ msg }) => req.flash('error', msg));
        return res.redirect('/new-category');
    }
    const { name } = req.body;
    try {
        await createCategory(name);
        req.flash('success', 'Category created successfully.');
        res.redirect('/categories');
    } catch (error) {
        if (error.code === '23505') {
            req.session.formData = req.body;
            req.flash('error', 'That category already exists.');
            return res.redirect('/new-category');
        }
        throw error;
    }
};

const showEditCategoryForm = async (req, res) => {
    if (!/^\d+$/.test(req.params.id)) { const error = new Error('Category not found.'); error.status = 404; throw error; }
    const category = req.session.formData || await getCategoryDetails(req.params.id);
    delete req.session.formData;
    if (!category) { const error = new Error('Category not found.'); error.status = 404; throw error; }
    categoryForm(res, { title: 'Edit Category', category });
};

const processEditCategoryForm = async (req, res) => {
    if (!/^\d+$/.test(req.params.id)) { const error = new Error('Category not found.'); error.status = 404; throw error; }
    const result = validationResult(req);
    if (!result.isEmpty()) {
        req.session.formData = { ...req.body, category_id: req.params.id };
        result.array().forEach(({ msg }) => req.flash('error', msg));
        return res.redirect(`/edit-category/${req.params.id}`);
    }
    const { name } = req.body;
    const category = { category_id: req.params.id, name: String(req.body.name ?? '').trim() };
    try {
        const updated = await updateCategory(req.params.id, name);
        if (!updated) { const error = new Error('Category not found.'); error.status = 404; throw error; }
        req.flash('success', 'Category updated successfully.');
        res.redirect(`/category/${req.params.id}`);
    } catch (error) {
        if (error.code === '23505') {
            req.session.formData = category;
            req.flash('error', 'That category already exists.');
            return res.redirect(`/edit-category/${req.params.id}`);
        }
        throw error;
    }
};

const showAssignCategoriesForm = async (req, res) => {
    const projectId = req.params.projectId || req.params.id;
    if (!/^\d+$/.test(projectId)) { const error = new Error('Service project not found.'); error.status = 404; throw error; }
    const [project, allCategories, assignedCategories] = await Promise.all([
        getProjectDetails(projectId), getAllCategories(), getCategoriesByProjectId(projectId)
    ]);
    if (!project) { const error = new Error('Service project not found.'); error.status = 404; throw error; }
    res.render('assign-categories', {
        title: 'Assign Categories to Project',
        project,
        allCategories,
        assignedCategories: assignedCategories.map((category) => String(category.category_id))
    });
};

const processAssignCategoriesForm = async (req, res) => {
    const projectId = req.params.projectId || req.params.id;
    if (!/^\d+$/.test(projectId)) { const error = new Error('Service project not found.'); error.status = 404; throw error; }
    const project = await getProjectDetails(projectId);
    if (!project) { const error = new Error('Service project not found.'); error.status = 404; throw error; }
    const requested = req.body.categoryIds === undefined ? [] : Array.isArray(req.body.categoryIds) ? req.body.categoryIds : [req.body.categoryIds];
    const allCategories = await getAllCategories();
    const valid = requested.every((id) => /^\d+$/.test(String(id)) && allCategories.some((category) => String(category.category_id) === String(id)));
    if (!valid) {
        req.flash('error', 'Please select valid project categories.');
        return res.redirect(`/project/${projectId}/assign-categories`);
    }
    await updateCategoryAssignments(projectId, requested.map(Number));
    req.flash('success', 'Project categories updated successfully.');
    res.redirect(`/project/${projectId}`);
};

export { showCategoriesPage, showCategoryDetailsPage, showNewCategoryForm, processNewCategoryForm, showEditCategoryForm, processEditCategoryForm, categoryValidation, showAssignCategoriesForm, processAssignCategoriesForm };
