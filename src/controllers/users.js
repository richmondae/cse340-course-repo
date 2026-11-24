import bcrypt from 'bcrypt';
import { body, validationResult } from 'express-validator';
import { authenticateUser, createUser, getAllUsers } from '../models/users.js';

const registrationValidation = [
    body('name').trim().notEmpty().withMessage('Name is required.')
        .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters.'),
    body('email').trim().isEmail().withMessage('Enter a valid email address.')
        .isLength({ max: 100 }).withMessage('Email must be 100 characters or fewer.')
        .normalizeEmail(),
    body('password').isLength({ min: 6, max: 72 })
        .withMessage('Password must be between 6 and 72 characters.')
];

const loginValidation = [
    body('email').trim().isEmail().withMessage('Enter a valid email address.')
        .isLength({ max: 100 }).withMessage('Email must be 100 characters or fewer.')
        .normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required.')
];

const showUserRegistrationForm = (req, res) => {
    const formData = req.session.formData || {};
    delete req.session.formData;
    res.render('register', { title: 'Create an Account', formData });
};

const processUserRegistrationForm = async (req, res) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        req.session.formData = { name: req.body.name, email: req.body.email };
        result.array().forEach(({ msg }) => req.flash('error', msg));
        return res.redirect('/register');
    }

    const name = String(req.body.name).trim();
    const email = String(req.body.email).trim().toLowerCase();
    try {
        const passwordHash = await bcrypt.hash(req.body.password, 10);
        await createUser(name, email, passwordHash);
        req.flash('success', 'Your account was created. Please log in.');
        res.redirect('/login');
    } catch (error) {
        if (error.code === '23505') {
            req.session.formData = { name, email };
            req.flash('error', 'An account with that email already exists.');
            return res.redirect('/register');
        }
        throw error;
    }
};

const showLoginForm = (req, res) => {
    if (req.query.loggedOut === '1') {
        req.flash('success', 'You have been logged out.');
    }
    const formData = req.session.formData || {};
    delete req.session.formData;
    res.render('login', { title: 'Log In', formData });
};

const processLoginForm = async (req, res) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        req.session.formData = { email: req.body.email };
        result.array().forEach(({ msg }) => req.flash('error', msg));
        return res.redirect('/login');
    }

    const email = String(req.body.email).trim().toLowerCase();
    const user = await authenticateUser(email, req.body.password);
    if (!user) {
        req.session.formData = { email };
        req.flash('error', 'Email or password is incorrect.');
        return res.redirect('/login');
    }

    await new Promise((resolve, reject) => {
        req.session.regenerate((error) => error ? reject(error) : resolve());
    });
    req.session.user = user;
    req.flash('success', `Welcome, ${user.name}.`);
    res.redirect('/dashboard');
};

const processLogout = (req, res, next) => {
    req.session.destroy((error) => {
        if (error) return next(error);
        res.clearCookie('connect.sid', { path: '/' });
        res.redirect('/login?loggedOut=1');
    });
};

const requireLogin = (req, res, next) => {
    if (!req.session.user) {
        req.flash('error', 'Please log in to view that page.');
        return res.redirect('/login');
    }
    next();
};

const requireRole = (roleName) => (req, res, next) => {
    if (!req.session.user) {
        req.flash('error', 'Please log in to view that page.');
        return res.redirect('/login');
    }
    if (req.session.user.role_name !== roleName) {
        req.flash('error', 'You do not have permission to view that page.');
        return res.redirect('/dashboard');
    }
    next();
};

const showDashboard = (req, res) => {
    res.render('dashboard', { title: 'Dashboard' });
};

const showUsersPage = async (req, res) => {
    const users = await getAllUsers();
    res.render('users', { title: 'Registered Users', users });
};

export {
    registrationValidation,
    loginValidation,
    showUserRegistrationForm,
    processUserRegistrationForm,
    showLoginForm,
    processLoginForm,
    processLogout,
    requireLogin,
    requireRole,
    showDashboard,
    showUsersPage
};
