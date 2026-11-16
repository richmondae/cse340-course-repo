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

const createCategory = async (name) => {
    const result = await db.query(
        'INSERT INTO public.category (name) VALUES ($1) RETURNING category_id;',
        [name]
    );
    return result.rows[0];
};

const updateCategory = async (id, name) => {
    const result = await db.query(
        'UPDATE public.category SET name = $1 WHERE category_id = $2 RETURNING category_id;',
        [name, id]
    );
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

const assignCategoryToProject = async (projectId, categoryId) => {
    await db.query(
        'INSERT INTO public.project_category (project_id, category_id) VALUES ($1, $2) ON CONFLICT DO NOTHING;',
        [projectId, categoryId]
    );
};

const updateCategoryAssignments = async (projectId, categoryIds = []) => {
    await db.query('DELETE FROM public.project_category WHERE project_id = $1;', [projectId]);
    for (const categoryId of categoryIds) {
        await assignCategoryToProject(projectId, categoryId);
    }
};

export { getAllCategories, getCategoryDetails, getCategoriesByProjectId, getProjectsByCategoryId, createCategory, updateCategory, assignCategoryToProject, updateCategoryAssignments };
