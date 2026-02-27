import { useEffect } from 'react';
import styles from './Modal.module.scss';

/**
 * Reusable modal dialog.
 * @param {boolean} isOpen - controls visibility
 * @param {function} onClose - called when backdrop or X is clicked
 * @param {string} title - modal header title
 * @param {ReactNode} children - modal body content
 * @param {string} size - 'sm' | 'md' | 'lg' (default: 'md')
 */
export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
    // Close on Escape key
    useEffect(() => {
        if (!isOpen) return;
        const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [isOpen, onClose]);

    // Prevent body scroll when open
    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className={styles.backdrop} onClick={onClose} role="dialog" aria-modal="true">
            <div
                className={`${styles.panel} ${styles[size]}`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className={styles.header}>
                    <h2 className={styles.title}>{title}</h2>
                    <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className={styles.body}>{children}</div>
            </div>
        </div>
    );
}
