import { getUpcomingProjects, getProjectDetails } from '../models/projects.js';
import { getCategoriesByProjectId } from '../models/categories.js';

const NUMBER_OF_UPCOMING_PROJECTS = 5;

const showProjectsPage = async (req, res) => {
    const projects = await getUpcomingProjects(NUMBER_OF_UPCOMING_PROJECTS);
    res.render('projects', { title: 'Upcoming Service Projects', projects });
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
        categories
    });
};

export { showProjectsPage, showProjectDetailsPage };
