const flashMiddleware = (req, res, next) => {
    req.session.flash ||= {};
    req.flash = (type, message) => {
        // A login can regenerate the session after this middleware runs.
        // Initialize flash storage each time so it also exists on that new session.
        req.session.flash ||= {};
        if (type && message !== undefined) {
            req.session.flash[type] ||= [];
            req.session.flash[type].push(message);
            return;
        }
        if (type) {
            const messages = req.session.flash[type] || [];
            delete req.session.flash[type];
            return messages;
        }
        const messages = req.session.flash;
        req.session.flash = {};
        return messages;
    };
    res.locals.flash = req.flash;
    next();
};

export default flashMiddleware;
