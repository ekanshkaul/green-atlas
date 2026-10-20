(() => {
    'use strict';

    const THEME_STORAGE_KEY = 'smvdu_floris_theme';
    const VALID_THEMES = new Set(['dark', 'light']);

    function getStoredTheme() {
        try {
            const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
            return VALID_THEMES.has(storedTheme) ? storedTheme : null;
        } catch (error) {
            return null;
        }
    }

    function getSystemTheme() {
        return window.matchMedia?.('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light';
    }

    function getInitialTheme() {
        return getStoredTheme() || getSystemTheme();
    }

    function setThemeIconState(theme) {
        const button = document.getElementById('themeToggleBtn');

        if (!button) {
            return;
        }

        const icon = button.querySelector('i');

        if (!icon) {
            return;
        }

        icon.classList.toggle('fa-sun', theme === 'dark');
        icon.classList.toggle('fa-moon', theme !== 'dark');

        button.setAttribute(
            'aria-label',
            theme === 'dark'
                ? 'Switch to light mode'
                : 'Switch to dark mode'
        );

        button.setAttribute(
            'title',
            theme === 'dark'
                ? 'Switch to light mode'
                : 'Switch to dark mode'
        );
    }

    function applyTheme(theme, persist = false) {
        const nextTheme = VALID_THEMES.has(theme)
            ? theme
            : getSystemTheme();

        document.documentElement.setAttribute('data-theme', nextTheme);
        setThemeIconState(nextTheme);

        if (persist) {
            try {
                localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
            } catch (error) {
                // Ignore storage errors.
            }
        }

        return nextTheme;
    }

    // Apply the theme as soon as this shared script loads.
    applyTheme(getInitialTheme());

    // Shared HTML escaping helper.
    window.escapeHtml = function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    };

    document.addEventListener('DOMContentLoaded', () => {
        /*
         * Highlight the current navigation item.
         */
        const currentPage = window.location.pathname
            .split('/')
            .pop()
            .toLowerCase();

        document.querySelectorAll('nav a[href]').forEach((link) => {
            const linkPage = link.getAttribute('href')
                ?.split('/')
                .pop()
                .split('?')[0]
                .toLowerCase();

            if (
                linkPage &&
                (
                    linkPage === currentPage ||
                    (currentPage === '' && linkPage === 'index.html')
                )
            ) {
                link.classList.add('active');
            }
        });

        /*
         * Retractable Navigation Drawer Handler (Hover + Click Support)
         */
        const menuBtn = document.getElementById('btn-toggle-menu');
        const navDrawer = document.getElementById('retractable-nav-drawer');
        const menuIcon = document.getElementById('menu-icon');
        const themeToggleBtn = document.getElementById('themeToggleBtn');

        if (menuBtn && navDrawer) {
            let closeTimer = null;

            function openDrawer() {
                if (closeTimer) clearTimeout(closeTimer);
                navDrawer.classList.add('open');
                navDrawer.setAttribute('aria-hidden', 'false');
                menuBtn.setAttribute('aria-expanded', 'true');
                if (menuIcon) {
                    menuIcon.className = 'fa-solid fa-xmark';
                }
            }

            function closeDrawer() {
                navDrawer.classList.remove('open');
                navDrawer.setAttribute('aria-hidden', 'true');
                menuBtn.setAttribute('aria-expanded', 'false');
                if (menuIcon) {
                    menuIcon.className = 'fa-solid fa-bars';
                }
            }

            // Hover behavior is only helpful on devices with a real pointer.
            const supportsHover = window.matchMedia?.('(hover: hover)').matches;
            function queueClose() {
                closeTimer = setTimeout(closeDrawer, 180);
            }

            if (supportsHover) {
                menuBtn.addEventListener('mouseenter', openDrawer);
                navDrawer.addEventListener('mouseenter', openDrawer);
                menuBtn.addEventListener('mouseleave', queueClose);
                navDrawer.addEventListener('mouseleave', queueClose);
            }

            // Manual toggle for click / touch devices
            menuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (navDrawer.classList.contains('open')) {
                    closeDrawer();
                } else {
                    openDrawer();
                }
            });

            // Close when clicking anywhere outside, EXCEPT when clicking the theme toggle button
            document.addEventListener('click', (e) => {
                const clickedThemeToggle = themeToggleBtn && (themeToggleBtn === e.target || themeToggleBtn.contains(e.target));
                if (
                    !navDrawer.contains(e.target) &&
                    !menuBtn.contains(e.target) &&
                    !clickedThemeToggle
                ) {
                    closeDrawer();
                }
            });
        }

        /*
         * Sticky navigation state. The header remains in document flow, while
         * the wordmark/controls row eases to the viewport edge once scrolled.
         */
        const pageHeader = document.querySelector('.home-header');
        if (pageHeader) {
            let headerFrame = null;

            const syncHeaderState = () => {
                pageHeader.classList.toggle('is-scrolled', window.scrollY > 2);
                headerFrame = null;
            };

            const requestHeaderSync = () => {
                if (headerFrame !== null) return;
                headerFrame = window.requestAnimationFrame(syncHeaderState);
            };

            syncHeaderState();
            window.addEventListener('scroll', requestHeaderSync, { passive: true });
            window.addEventListener('resize', requestHeaderSync);
            window.addEventListener('pageshow', syncHeaderState);
        }

        /*
         * Theme toggle handler.
         */
        themeToggleBtn?.addEventListener('click', () => {
            const currentTheme =
                document.documentElement.getAttribute('data-theme') ||
                getSystemTheme();

            const nextTheme =
                currentTheme === 'dark'
                    ? 'light'
                    : 'dark';

            // Changing theme retains whatever open state the nav drawer has
            applyTheme(nextTheme, true);
        });

        /*
         * Synchronize theme changes between open tabs/windows.
         */
        window.addEventListener('storage', (event) => {
            if (event.key !== THEME_STORAGE_KEY) {
                return;
            }

            if (VALID_THEMES.has(event.newValue)) {
                applyTheme(event.newValue);
            } else {
                applyTheme(getSystemTheme());
            }
        });

        /*
         * Operating system theme change synchronization.
         */
        const mediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)');
        mediaQuery?.addEventListener?.('change', () => {
            if (!getStoredTheme()) {
                applyTheme(getSystemTheme());
            }
        });

        /*
         * Register service worker.
         */
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js').catch(() => {});
        }
    });
})();

/* =========================================================
   PAGE & WINDOW TRANSITIONS
   ========================================================= */
(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!reduceMotion) {
        document.body.classList.add('page-enter');
        window.addEventListener('pageshow', () => {
            document.body.classList.remove('page-exit');
            document.body.classList.add('page-enter');
        });
    }

    document.addEventListener('click', (event) => {
        const link = event.target.closest('a[href]');
        if (!link || reduceMotion) return;

        const href = link.getAttribute('href');
        if (
            !href ||
            href.startsWith('#') ||
            href.startsWith('mailto:') ||
            href.startsWith('tel:') ||
            link.target === '_blank' ||
            link.hasAttribute('download')
        ) {
            return;
        }

        const destination = new URL(href, window.location.href);
        if (destination.origin !== window.location.origin) return;

        if (
            destination.pathname === window.location.pathname &&
            destination.search === window.location.search &&
            destination.hash
        ) {
            return;
        }

        event.preventDefault();
        document.body.classList.remove('page-enter');
        document.body.classList.add('page-exit');

        setTimeout(() => {
            window.location.href = destination.href;
        }, 180);
    });

    window.addEventListener('pageshow', (event) => {
        if (event.persisted) {
            document.body.classList.remove('page-exit');
        }
    });
})();