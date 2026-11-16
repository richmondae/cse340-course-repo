import { getAllOrganizations, getOrganizationDetails, createOrganization, updateOrganization } from '../models/organizations.js';
import { getProjectsByOrganizationId } from '../models/projects.js';
import { body, validationResult } from 'express-validator';

const organizationValidation = [
    body('name').trim().notEmpty().withMessage('Organization name is required.')
        .isLength({ min: 3, max: 150 }).withMessage('Organization name must be between 3 and 150 characters.'),
    body('description').trim().notEmpty().withMessage('Organization description is required.')
        .isLength({ max: 500 }).withMessage('Organization description cannot exceed 500 characters.'),
    body('contact_email').trim().notEmpty().withMessage('Contact email is required.')
        .isEmail().withMessage('Please provide a valid email address.'),
    body('logo_filename').isIn(['brightfuture-logo.svg', 'greenharvest-logo.svg', 'unityserve-logo.svg'])
        .withMessage('Choose a valid organization logo.')
];

const organizationForm = (res, { title, organization = {}, errors = [], status = 200 }) =>
    res.status(status).render(organization.organization_id ? 'edit-organization' : 'new-organization', { title, organization, errors });

const showOrganizationsPage = async (req, res) => {
    const organizations = await getAllOrganizations();
    res.render('organizations', { title: 'Our Partner Organizations', organizations, success: req.query.success });
};

const showOrganizationDetailsPage = async (req, res) => {
    const organizationId = req.params.id;
    if (!/^\d+$/.test(organizationId)) {
        const error = new Error('Organization not found.');
        error.status = 404;
        throw error;
    }

    const organizationDetails = await getOrganizationDetails(organizationId);
    if (!organizationDetails) {
        const error = new Error('Organization not found.');
        error.status = 404;
        throw error;
    }

    const projects = await getProjectsByOrganizationId(organizationId);
    res.render('organization', {
        title: organizationDetails.name,
        organizationDetails,
        projects,
        success: req.query.success
    });
};

const showNewOrganizationForm = (req, res) => {
    const organization = req.session.formData || {};
    delete req.session.formData;
    organizationForm(res, { title: 'Add an Organization', organization });
};

const processNewOrganizationForm = async (req, res) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        req.session.formData = req.body;
        result.array().forEach(({ msg }) => req.flash('error', msg));
        return res.redirect('/new-organization');
    }
    const value = req.body;
    try {
        const createdId = await createOrganization(value.name, value.description, value.contact_email, value.logo_filename);
        req.flash('success', 'Organization created successfully.');
        res.redirect(`/organization/${createdId}`);
    } catch (error) {
        if (error.code === '23505') {
            req.session.formData = req.body;
            req.flash('error', 'An organization with that name already exists.');
            return res.redirect('/new-organization');
        }
        throw error;
    }
};

const showEditOrganizationForm = async (req, res) => {
    if (!/^\d+$/.test(req.params.id)) { const error = new Error('Organization not found.'); error.status = 404; throw error; }
    const organization = req.session.formData || await getOrganizationDetails(req.params.id);
    delete req.session.formData;
    if (!organization) {
        const error = new Error('Organization not found.'); error.status = 404; throw error;
    }
    organizationForm(res, { title: 'Edit Organization', organization });
};

const processEditOrganizationForm = async (req, res) => {
    if (!/^\d+$/.test(req.params.id)) { const error = new Error('Organization not found.'); error.status = 404; throw error; }
    const result = validationResult(req);
    if (!result.isEmpty()) {
        req.session.formData = { ...req.body, organization_id: req.params.id };
        result.array().forEach(({ msg }) => req.flash('error', msg));
        return res.redirect(`/edit-organization/${req.params.id}`);
    }
    const value = req.body;
    const organization = { ...req.body, organization_id: req.params.id };
    try {
        const updated = await updateOrganization(req.params.id, value.name, value.description, value.contact_email, value.logo_filename);
        if (!updated) { const error = new Error('Organization not found.'); error.status = 404; throw error; }
        req.flash('success', 'Organization updated successfully.');
        res.redirect(`/organization/${req.params.id}`);
    } catch (error) {
        if (error.code === '23505') {
            req.session.formData = organization;
            req.flash('error', 'An organization with that name already exists.');
            return res.redirect(`/edit-organization/${req.params.id}`);
        }
        throw error;
    }
};

export { showOrganizationsPage, showOrganizationDetailsPage, showNewOrganizationForm, processNewOrganizationForm, showEditOrganizationForm, processEditOrganizationForm, organizationValidation };
