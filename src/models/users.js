import db from './db.js';
import bcrypt from 'bcrypt';

const createUser = async (name, email, passwordHash) => {
    const query = `
        INSERT INTO public.users (name, email, password_hash, role_id)
        SELECT $1, $2, $3, role_id
        FROM public.roles
        WHERE role_name = 'user'
        RETURNING user_id
    `;
    const result = await db.query(query, [name, email, passwordHash]);
    if (!result.rows[0]) {
        throw new Error('The default user role is missing from the database.');
    }
    return result.rows[0].user_id;
};

const findUserByEmail = async (email) => {
    const query = `
        SELECT u.user_id, u.name, u.email, u.password_hash, r.role_name
        FROM public.users AS u
        INNER JOIN public.roles AS r ON r.role_id = u.role_id
        WHERE u.email = $1
        LIMIT 1
    `;
    const result = await db.query(query, [email]);
    return result.rows[0] || null;
};

const authenticateUser = async (email, password) => {
    const user = await findUserByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
        return null;
    }

    const { password_hash, ...authenticatedUser } = user;
    return authenticatedUser;
};

const getAllUsers = async () => {
    const query = `
        SELECT u.user_id, u.name, u.email, r.role_name, u.created_at
        FROM public.users AS u
        INNER JOIN public.roles AS r ON r.role_id = u.role_id
        ORDER BY u.name, u.email
    `;
    const result = await db.query(query);
    return result.rows;
};

export { createUser, findUserByEmail, authenticateUser, getAllUsers };
