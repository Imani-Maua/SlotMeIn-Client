import { createContext, useContext, useState, useCallback, useRef } from 'react';
import styles from './Toast.module.scss';

const ToastContext = createContext(null);

const ICONS = {
    success: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    ),
    error: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    ),
    info: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
    ),
};

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const timerRef = useRef({});

    const dismiss = useCallback((id) => {
        setToasts((t) => t.filter((x) => x.id !== id));
        clearTimeout(timerRef.current[id]);
    }, []);

    const toast = useCallback(({ message, type = 'info', duration = 4000 }) => {
        const id = Date.now();
        setToasts((t) => [...t, { id, message, type }]);
        timerRef.current[id] = setTimeout(() => dismiss(id), duration);
    }, [dismiss]);

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <div className={styles.container}>
                {toasts.map(({ id, message, type }) => (
                    <div key={id} className={`${styles.toast} ${styles[type]}`}>
                        <span className={styles.icon}>{ICONS[type]}</span>
                        <span className={styles.message}>{message}</span>
                        <button className={styles.dismiss} onClick={() => dismiss(id)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within a ToastProvider');
    return ctx;
}
