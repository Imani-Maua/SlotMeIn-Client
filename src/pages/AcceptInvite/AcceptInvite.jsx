import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { acceptInvite } from '../../api/authService';
import styles from './AcceptInvite.module.scss';

export default function AcceptInvite() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    if (!token) {
        return (
            <div className={styles.page}>
                <div className={styles.card}>
                    <div className={styles.missingToken}>
                        <span className={styles.missingTokenIcon}>🔗</span>
                        <h1 className={styles.missingTokenTitle}>Invalid invite link</h1>
                        <p>This link is missing or broken. Please ask your manager to resend the invite.</p>
                    </div>
                </div>
            </div>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }

        if (password !== confirm) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            await acceptInvite(token, password);
            setSuccess(true);
        } catch (err) {
            const detail = err?.response?.data?.detail;
            setError(detail || 'Something went wrong. Your invite link may have expired.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className={styles.page}>
                <div className={styles.card}>
                    <div className={styles.success}>
                        <span className={styles.successIcon}>🎉</span>
                        <h2 className={styles.successTitle}>You're all set!</h2>
                        <p className={styles.successText}>
                            Your account is now active. Sign in with your new password.
                        </p>
                        <button className={styles.successBtn} onClick={() => navigate('/login')}>
                            Go to login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <div className={styles.card}>

                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.icon}>
                        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12.65 10A6 6 0 1 0 14 13.65L21 21l-1.5 1.5L18 21l-1.5 1.5L15 21l1.5-1.5L15 18l2.85-2.85c-.24-.42-.44-.87-.58-1.34L12.65 10zm-4.65 6a4 4 0 1 1 0-8 4 4 0 0 1 0 8z" />
                        </svg>
                    </div>
                    <h1 className={styles.title}>Set your password</h1>
                    <p className={styles.subtitle}>
                        Create a secure password to activate your SlotMeIn account.
                    </p>
                </div>

                {/* Error */}
                {error && <div className={styles.error}>{error}</div>}

                {/* Form */}
                <form className={styles.form} onSubmit={handleSubmit} noValidate>
                    <div className={styles.formGroup}>
                        <label htmlFor="new-password">New password</label>
                        <input
                            id="new-password"
                            type="password"
                            placeholder="At least 8 characters"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="new-password"
                            required
                        />
                        <span className={styles.passwordHint}>Minimum 8 characters</span>
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="confirm-password">Confirm password</label>
                        <input
                            id="confirm-password"
                            type="password"
                            placeholder="Repeat your password"
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            autoComplete="new-password"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className={styles.submit}
                        disabled={loading || !password || !confirm}
                    >
                        {loading ? 'Activating account…' : 'Activate account'}
                    </button>
                </form>
            </div>
        </div>
    );
}
