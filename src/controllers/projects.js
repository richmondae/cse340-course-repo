import { getAllProjects, getProjectDetails, createProject, updateProject } from '../models/projects.js';
import { getCategoriesByProjectId, getAllCategories } from '../models/categories.js';
import { getAllOrganizations } from '../models/organizations.js';
import { updateCategoryAssignments } from '../models/categories.js';
import { body, validationResult } from 'express-validator';

const projectValidation = [
    body('title').trim().notEmpty().withMessage('Project title is required.')
        .isLength({ min: 3, max: 200 }).withMessage('Project title must be between 3 and 200 characters.'),
    body('description').trim().notEmpty().withMessage('Project description is required.')
        .isLength({ max: 1000 }).withMessage('Project description cannot exceed 1000 characters.'),
    body('location').trim().notEmpty().withMessage('Project location is required.')
        .isLength({ max: 200 }).withMessage('Project location cannot exceed 200 characters.'),
    body('project_date').notEmpty().withMessage('Project date is required.').isISO8601().withMessage('Enter a valid project date.'),
    body('organization_id').notEmpty().withMessage('Choose a sponsoring organization.').isInt().withMessage('Choose a valid sponsoring organization.'),
    body('categoryIds').optional().custom((ids) => {
        const list = Array.isArray(ids) ? ids : [ids];
        return list.every((id) => /^\d+$/.test(String(id)));
    }).withMessage('Choose valid project categories.')
];

const selectedCategoryIds = (input) => {
    const ids = input.categoryIds === undefined ? [] : Array.isArray(input.categoryIds) ? input.categoryIds : [input.categoryIds];
    return ids.map(Number);
};

const renderProjectForm = async (res, { title, project = {}, categories = [], errors = [], status = 200 }) => {
    const [organizations, allCategories] = await Promise.all([getAllOrganizations(), getAllCategories()]);
    res.status(status).render('project-form', { title, project, organizations, categories, allCategories, errors });
};

const validateProject = (input, organizations, categories) => {
    const errors = [];
    const value = {
        title: String(input.title ?? '').trim(),
        description: String(input.description ?? '').trim(),
        location: String(input.location ?? '').trim(),
        project_date: String(input.project_date ?? '').trim(),
        organization_id: String(input.organization_id ?? '').trim(),
        category_ids: selectedCategoryIds(input)
    };
    if (!value.title || value.title.length < 3 || value.title.length > 200) errors.push('Project title must be between 3 and 200 characters.');
    if (!value.description || value.description.length > 1000) errors.push('Description is required and cannot exceed 1000 characters.');
    if (!value.location || value.location.length > 200) errors.push('Location is required and must be 200 characters or fewer.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value.project_date) || Number.isNaN(Date.parse(value.project_date))) errors.push('Choose a valid project date.');
    if (!organizations.some((organization) => String(organization.organization_id) === value.organization_id)) errors.push('Choose a valid sponsoring organization.');
    if (value.category_ids.some((id) => !categories.some((category) => String(category.category_id) === String(id)))) errors.push('Choose valid project categories.');
    return { value, errors };
};

const showProjectsPage = async (req, res) => {
    const projects = await getAllProjects();
    res.render('projects', { title: 'Service Projects', projects, success: req.query.success });
};

const showProjectDetailsPage = async (req, res) => {
    const projectId = req.params.id;
    if (!/^\d+$/.test(projectId)) {
        const error = new Error('Service project not found.');
        error.status = 404;
        throw error;
    }

    const projectDetails = await getProjectDetails(projectId);
    if (!projectDetails) {
        const error = new Error('Service project not found.');
        error.status = 404;
        throw error;
    }

    const categories = await getCategoriesByProjectId(projectId);
    res.render('project', {
        title: projectDetails.title,
        projectDetails,
        categories,
        success: req.query.success
    });
};

const showNewProjectForm = (req, res) => {
    const project = req.session.formData || {};
    const categories = selectedCategoryIds(project).map(String);
    delete req.session.formData;
    return renderProjectForm(res, { title: 'Add a Service Project', project, categories });
};

const processNewProjectForm = async (req, res) => {
    const [organizations, categories] = await Promise.all([getAllOrganizations(), getAllCategories()]);
    const result = validationResult(req);
    const { value, errors } = validateProject(req.body, organizations, categories);
    errors.push(...result.array().map(({ msg }) => msg));
    if (errors.length) {
        req.session.formData = req.body;
        errors.forEach((message) => req.flash('error', message));
        return res.redirect('/new-project');
    }
    try {
        const projectId = await createProject(value.title, value.description, value.location, value.project_date, value.organization_id);
        await updateCategoryAssignments(projectId, value.category_ids);
        req.flash('success', 'Service project created successfully.');
        res.redirect('/projects');
    } catch (error) {
        if (error.code === '23505') {
            req.session.formData = req.body;
            req.flash('error', 'That organization already has a project with this title.');
            return res.redirect('/new-project');
        }
        throw error;
    }
};

const showEditProjectForm = async (req, res) => {
    if (!/^\d+$/.test(req.params.id)) { const error = new Error('Service project not found.'); error.status = 404; throw error; }
    const formData = req.session.formData;
    const project = formData || await getProjectDetails(req.params.id);
    delete req.session.formData;
    if (!project) { const error = new Error('Service project not found.'); error.status = 404; throw error; }
    const categories = formData
        ? selectedCategoryIds(formData).map(String)
        : (await getCategoriesByProjectId(req.params.id)).map((category) => String(category.category_id));
    renderProjectForm(res, { title: 'Edit Service Project', project, categories });
};

const processEditProjectForm = async (req, res) => {
    if (!/^\d+$/.test(req.params.id)) { const error = new Error('Service project not found.'); error.status = 404; throw error; }
    const [organizations, allCategories] = await Promise.all([getAllOrganizations(), getAllCategories()]);
    const result = validationResult(req);
    const { value, errors } = validateProject(req.body, organizations, allCategories);
    errors.push(...result.array().map(({ msg }) => msg));
    const project = { ...req.body, project_id: req.params.id };
    if (errors.length) {
        req.session.formData = project;
        errors.forEach((message) => req.flash('error', message));
        return res.redirect(`/edit-project/${req.params.id}`);
    }
    try {
        const updated = await updateProject(req.params.id, value.title, value.description, value.location, value.project_date, value.organization_id);
        if (!updated) { const error = new Error('Service project not found.'); error.status = 404; throw error; }
        await updateCategoryAssignments(req.params.id, value.category_ids);
        req.flash('success', 'Service project updated successfully.');
        res.redirect(`/project/${req.params.id}`);
    } catch (error) {
        if (error.code === '23505') {
            req.session.formData = project;
            req.flash('error', 'That organization already has a project with this title.');
            return res.redirect(`/edit-project/${req.params.id}`);
        }
        throw error;
    }
};

export { showProjectsPage, showProjectDetailsPage, showNewProjectForm, processNewProjectForm, showEditProjectForm, processEditProjectForm, projectValidation };
