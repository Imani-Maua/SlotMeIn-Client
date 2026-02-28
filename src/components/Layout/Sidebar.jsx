import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './Sidebar.module.scss';

const NAV_ITEMS = [
    {
        to: '/dashboard',
        label: 'Dashboard',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
        ),
    },
    {
        to: '/talents',
        label: 'Talents',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
        ),
    },
    {
        to: '/shifts',
        label: 'Shifts',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
            </svg>
        ),
    },
    {
        to: '/schedule',
        label: 'Schedule',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
        ),
    },
];

const ADMIN_ITEM = {
    to: '/admin/users',
    label: 'Users',
    icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
    ),
};

export default function Sidebar() {
    const { logout, role } = useAuth();
    const navigate = useNavigate();

    const isAdmin = role === 'superuser';

    function handleLogout() {
        logout();
        navigate('/login');
    }

    return (
        <aside className={styles.sidebar}>
            {/* Logo */}
            <div className={styles.logo}>
                <div className={styles.logoIcon}>
                    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20,20 H40 C40,14 38,4 50,4 C62,4 60,14 60,20 H80 V40 C74,40 64,38 64,50 C64,62 74,60 80,60 V80 H60 C60,74 62,64 50,64 C38,64 40,74 40,80 H20 V60 C14,60 4,62 4,50 C4,38 14,40 20,40 V20Z" />
                    </svg>
                </div>
                <span className={styles.logoText}>SlotMeIn</span>
            </div>

            {/* Nav */}
            <nav className={styles.nav}>
                <ul className={styles.navList}>
                    {NAV_ITEMS.map(({ to, label, icon }) => (
                        <li key={to}>
                            <NavLink
                                to={to}
                                className={({ isActive }) =>
                                    `${styles.navItem} ${isActive ? styles.active : ''}`
                                }
                            >
                                <span className={styles.navIcon}>{icon}</span>
                                <span className={styles.navLabel}>{label}</span>
                            </NavLink>
                        </li>
                    ))}

                    {isAdmin && (
                        <li className={styles.adminSection}>
                            <span className={styles.sectionLabel}>Admin</span>
                            <NavLink
                                to={ADMIN_ITEM.to}
                                className={({ isActive }) =>
                                    `${styles.navItem} ${isActive ? styles.active : ''}`
                                }
                            >
                                <span className={styles.navIcon}>{ADMIN_ITEM.icon}</span>
                                <span className={styles.navLabel}>{ADMIN_ITEM.label}</span>
                            </NavLink>
                        </li>
                    )}
                </ul>
            </nav>

            {/* Logout */}
            <button className={styles.logoutBtn} onClick={handleLogout}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>Log out</span>
            </button>
        </aside>
    );
}
