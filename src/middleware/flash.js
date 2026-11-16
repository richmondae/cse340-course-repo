const flashMiddleware = (req, res, next) => {
    req.session.flash ||= {};
    req.flash = (type, message) => {
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
