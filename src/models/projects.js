import db from './db.js';

const getAllProjects = async () => {
    const query = `
        SELECT
            p.project_id,
            p.title,
            p.description,
            p.project_date AS date,
            TO_CHAR(p.project_date, 'FMMonth FMDD, YYYY') AS formatted_date,
            p.location,
            p.organization_id,
            o.name AS organization_name
        FROM public.project AS p
        INNER JOIN public.organization AS o
            ON p.organization_id = o.organization_id
        ORDER BY p.project_date ASC, p.project_id ASC;
    `;

    const result = await db.query(query);
    return result.rows;
};

const getUpcomingProjects = async (number_of_projects) => {
    const limit = Number(number_of_projects);
    if (!Number.isInteger(limit) || limit < 1) {
        throw new TypeError('The number of upcoming projects must be a positive integer.');
    }

    const query = `
        SELECT
            p.project_id,
            p.title,
            p.description,
            p.project_date AS date,
            TO_CHAR(p.project_date, 'FMMonth FMDD, YYYY') AS formatted_date,
            p.location,
            p.organization_id,
            o.name AS organization_name
        FROM public.project AS p
        INNER JOIN public.organization AS o
            ON p.organization_id = o.organization_id
        WHERE p.project_date >= CURRENT_DATE
        ORDER BY p.project_date ASC, p.project_id ASC
        LIMIT $1;
    `;

    const result = await db.query(query, [limit]);
    return result.rows;
};

const getProjectDetails = async (id) => {
    const query = `
        SELECT
            p.project_id,
            p.title,
            p.description,
            p.project_date AS date,
            TO_CHAR(p.project_date, 'FMMonth FMDD, YYYY') AS formatted_date,
            p.location,
            p.organization_id,
            o.name AS organization_name
        FROM public.project AS p
        INNER JOIN public.organization AS o
            ON p.organization_id = o.organization_id
        WHERE p.project_id = $1;
    `;

    const result = await db.query(query, [id]);
    return result.rows[0] ?? null;
};

const getProjectsByOrganizationId = async (organizationId) => {
    const query = `
        SELECT
            project_id,
            organization_id,
            title,
            description,
            project_date AS date,
            TO_CHAR(project_date, 'FMMonth FMDD, YYYY') AS formatted_date,
            location
        FROM public.project
        WHERE organization_id = $1
        ORDER BY project_date ASC, project_id ASC;
    `;

    const result = await db.query(query, [organizationId]);
    return result.rows;
};

export { getAllProjects, getUpcomingProjects, getProjectDetails, getProjectsByOrganizationId };
