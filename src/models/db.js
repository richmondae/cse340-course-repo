import { Pool } from 'pg';

if (!process.env.DB_URL) {
    throw new Error('DB_URL is not set. Add your PostgreSQL connection URL to the environment.');
}

const pool = new Pool({
    connectionString: process.env.DB_URL,
    ssl: true
});

let db = pool;

if (process.env.NODE_ENV === 'development' && process.env.ENABLE_SQL_LOGGING === 'true') {
    db = {
        async query(text, params) {
            try {
                const start = Date.now();
                const result = await pool.query(text, params);
                const duration = Date.now() - start;
                console.log('Executed query:', {
                    text: text.replace(/\s+/g, ' ').trim(),
                    duration: `${duration}ms`,
                    rows: result.rowCount
                });
                return result;
            } catch (error) {
                console.error('Error in query:', {
                    text: text.replace(/\s+/g, ' ').trim(),
                    error: error.message
                });
                throw error;
            }
        },
        async close() {
            await pool.end();
        }
    };
}

const testConnection = async () => {
    const result = await db.query('SELECT NOW() AS current_time');
    console.log('Database connection successful:', result.rows[0].current_time);
    return true;
};

export { db as default, testConnection };
