import { Outlet, useNavigate } from 'react-router-dom';
import { useJob } from '../../context/JobContext';
import Sidebar from './Sidebar';
import Spinner from '../Spinner/Spinner';
import TutorialOverlay from '../Tutorial/TutorialOverlay';
import styles from './AppLayout.module.scss';

export default function AppLayout() {
    const { pendingJobId, notification, setNotification } = useJob();
    const navigate = useNavigate();

    function handleViewDraft() {
        navigate('/schedule', { state: { openScheduleId: notification.scheduleId } });
        setNotification(null);
    }

    return (
        <div className={styles.layout}>
            <TutorialOverlay />
            <Sidebar />
            <div className={styles.rightPane}>
                {pendingJobId && (
                    <div className={styles.banner}>
                        <Spinner size="sm" />
                        <span>Generating schedule in the background…</span>
                    </div>
                )}
                {notification?.type === 'done' && (
                    <div className={`${styles.banner} ${styles.bannerSuccess}`}>
                        <span>Schedule for week of {notification.weekStart} is ready.</span>
                        <button className={styles.bannerAction} onClick={handleViewDraft}>View draft</button>
                        <button className={styles.bannerClose} onClick={() => setNotification(null)}>×</button>
                    </div>
                )}
                {(notification?.type === 'failed' || notification?.type === 'timeout' || notification?.type === 'error') && (
                    <div className={`${styles.banner} ${styles.bannerError}`}>
                        <span>
                            {notification.type === 'timeout'
                                ? 'Schedule generation timed out. Try again.'
                                : notification.type === 'failed' && notification.error
                                    ? notification.error
                                    : 'Schedule generation failed. Please try again.'}
                        </span>
                        <button className={styles.bannerClose} onClick={() => setNotification(null)}>×</button>
                    </div>
                )}
                <main className={styles.main}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
