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

const createProject = async (title, description, location, date, organizationId) => {
    const inserted = await db.query(`
        INSERT INTO public.project (title, description, location, project_date, organization_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING project_id;
    `, [title, description, location, date, organizationId]);
    return inserted.rows[0].project_id;
};

const updateProject = async (id, title, description, location, date, organizationId) => {
    const updated = await db.query(`
        UPDATE public.project
        SET title = $1, description = $2, location = $3, project_date = $4, organization_id = $5
        WHERE project_id = $6
        RETURNING project_id;
    `, [title, description, location, date, organizationId, id]);
    if (!updated.rows[0]) {
        const error = new Error('Service project not found.');
        error.status = 404;
        throw error;
    }
    return updated.rows[0].project_id;
};

export { getAllProjects, getUpcomingProjects, getProjectDetails, getProjectsByOrganizationId, createProject, updateProject };
