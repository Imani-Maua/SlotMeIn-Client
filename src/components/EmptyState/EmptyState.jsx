import styles from './EmptyState.module.scss';

/**
 * Reusable empty state component for when lists/tables have no data.
 * @param {ReactNode} icon - SVG icon to display
 * @param {string} title - Main heading 
 * @param {string} description - Subtext explaining why it's empty
 * @param {ReactNode} action - Optional button/action element
 */
export default function EmptyState({ icon, title, description, action }) {
    return (
        <div className={styles.container}>
            <div className={styles.iconWrapper}>
                {icon}
            </div>
            <h3 className={styles.title}>{title}</h3>
            {description && <p className={styles.description}>{description}</p>}
            {action && <div className={styles.action}>{action}</div>}
        </div>
    );
}
