const showHomePage = (req, res) => {
    res.render('home', { title: 'Home' });
};

export { showHomePage };
