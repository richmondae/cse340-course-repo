document.documentElement.classList.add('js');

const menuButton = document.querySelector('.site-nav-toggle');
const navigation = document.querySelector('#primary-navigation');

if (menuButton && navigation) {
    const setMenuOpen = (isOpen) => {
        menuButton.setAttribute('aria-expanded', String(isOpen));
        menuButton.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
        navigation.classList.toggle('is-open', isOpen);
    };

    menuButton.addEventListener('click', () => {
        const isExpanded = menuButton.getAttribute('aria-expanded') === 'true';
        setMenuOpen(!isExpanded);
    });

    navigation.addEventListener('click', (event) => {
        if (event.target.closest('a')) {
            setMenuOpen(false);
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
            setMenuOpen(false);
            menuButton.focus();
        }
    });
}
