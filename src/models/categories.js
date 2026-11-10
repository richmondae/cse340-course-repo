import db from './db.js';

const getAllCategories = async () => {
    const query = `
        SELECT category_id, name
        FROM public.category
        ORDER BY name;
    `;

    const result = await db.query(query);
    return result.rows;
};

const getCategoryDetails = async (id) => {
    const query = `
        SELECT category_id, name
        FROM public.category
        WHERE category_id = $1;
    `;

    const result = await db.query(query, [id]);
    return result.rows[0] ?? null;
};

const getCategoriesByProjectId = async (projectId) => {
    const query = `
        SELECT c.category_id, c.name
        FROM public.project_category AS pc
        INNER JOIN public.category AS c
            ON c.category_id = pc.category_id
        WHERE pc.project_id = $1
        ORDER BY c.name;
    `;

    const result = await db.query(query, [projectId]);
    return result.rows;
};

const getProjectsByCategoryId = async (categoryId) => {
    const query = `
        SELECT
            p.project_id,
            p.title,
            p.project_date AS date,
            TO_CHAR(p.project_date, 'FMMonth FMDD, YYYY') AS formatted_date,
            p.location,
            p.organization_id,
            o.name AS organization_name
        FROM public.project_category AS pc
        INNER JOIN public.project AS p
            ON p.project_id = pc.project_id
        INNER JOIN public.organization AS o
            ON o.organization_id = p.organization_id
        WHERE pc.category_id = $1
        ORDER BY p.project_date ASC, p.title;
    `;

    const result = await db.query(query, [categoryId]);
    return result.rows;
};

export { getAllCategories, getCategoryDetails, getCategoriesByProjectId, getProjectsByCategoryId };
