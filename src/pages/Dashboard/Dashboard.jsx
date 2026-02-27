import styles from './Dashboard.module.scss';

export default function Dashboard() {
    return (
        <div className={styles.page}>
            <h1>Dashboard</h1>
            <p>You are logged in! 🎉</p>
        </div>
    );
}
