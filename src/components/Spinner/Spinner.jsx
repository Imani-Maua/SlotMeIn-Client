import styles from './Spinner.module.scss';

/**
 * Loading spinner component.
 * @param {string} size - 'sm' | 'md' | 'lg' (default: 'md')
 * @param {boolean} fullScreen - Centers spinner on the page
 */
export default function Spinner({ size = 'md', fullScreen = false }) {
    const spinner = <div className={`${styles.spinner} ${styles[size]}`}></div>;

    if (fullScreen) {
        return <div className={styles.fullScreen}>{spinner}</div>;
    }

    return spinner;
}
