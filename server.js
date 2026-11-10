import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import router from './src/routes.js';
import { testConnection } from './src/models/db.js';

const NODE_ENV = process.env.NODE_ENV?.toLowerCase() || 'production';
const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/views'));

// Log requests during development and make the environment available to EJS.
app.use((req, res, next) => {
    if (NODE_ENV === 'development') {
        console.log(`${req.method} ${req.url}`);
    }
    next();
});

app.use((req, res, next) => {
    res.locals.NODE_ENV = NODE_ENV;
    next();
});

app.use(express.static(path.join(__dirname, 'public')));
app.use('/', router);

// Unmatched requests become 404 errors and use the same handler as other errors.
app.use((req, res, next) => {
    const error = new Error('Page Not Found');
    error.status = 404;
    next(error);
});

// Centralized error handler for missing pages and unexpected server errors.
app.use((error, req, res, next) => {
    console.error('Error occurred:', error.message);
    console.error('Stack trace:', error.stack);

    if (res.headersSent) {
        return next(error);
    }

    const status = error.status === 404 ? 404 : 500;
    const template = status === 404 ? 'errors/404' : 'errors/500';
    res.status(status).render(template, {
        title: status === 404 ? 'Page Not Found' : 'Server Error',
        error: error.message,
        stack: error.stack
    });
});

const startServer = async () => {
    try {
        await testConnection();
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Server is running at http://127.0.0.1:${PORT}`);
            console.log(`Environment: ${NODE_ENV}`);
        });
    } catch (error) {
        console.error('Error connecting to the database:', error.message);
        process.exitCode = 1;
    }
};

startServer();
