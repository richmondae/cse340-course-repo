import { getAllOrganizations, getOrganizationDetails } from '../models/organizations.js';
import { getProjectsByOrganizationId } from '../models/projects.js';

const showOrganizationsPage = async (req, res) => {
    const organizations = await getAllOrganizations();
    res.render('organizations', { title: 'Our Partner Organizations', organizations });
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
        projects
    });
};

export { showOrganizationsPage, showOrganizationDetailsPage };
