import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import styles from './AppLayout.module.scss';

export default function AppLayout() {
    return (
        <div className={styles.layout}>
            <Sidebar />
            <main className={styles.main}>
                <Outlet />
            </main>
        </div>
    );
}
