import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { login } from '../../api/authService';
import styles from './Login.module.scss';

export default function Login() {
    const navigate = useNavigate();
    const { saveAuth } = useAuth();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const data = await login(username, password);
            saveAuth(data.access_token, data.role, data.firstname);
            navigate('/dashboard');
        } catch (err) {
            const detail = err?.response?.data?.detail;
            setError(detail || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.card}>

                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.logo}>
                        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20,20 H40 C40,14 38,4 50,4 C62,4 60,14 60,20 H80 V40 C74,40 64,38 64,50 C64,62 74,60 80,60 V80 H60 C60,74 62,64 50,64 C38,64 40,74 40,80 H20 V60 C14,60 4,62 4,50 C4,38 14,40 20,40 V20Z" />
                        </svg>
                    </div>
                    <h1 className={styles.title}>SlotMeIn</h1>
                    <p className={styles.subtitle}>Sign in to manage your team's schedule</p>
                </div>

                {/* Error */}
                {error && <div className={styles.error}>{error}</div>}

                {/* Form */}
                <form className={styles.form} onSubmit={handleSubmit} noValidate>
                    <div className={styles.formGroup}>
                        <label htmlFor="username">Username</label>
                        <input
                            id="username"
                            type="text"
                            placeholder="e.g. jane.doe"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            autoComplete="username"
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className={styles.submit}
                        disabled={loading || !username || !password}
                    >
                        {loading ? 'Signing in…' : 'Sign in'}
                    </button>
                </form>

                <p className={styles.footer}>
                    Don't have access yet? Ask your manager to send you an invite.
                </p>
            </div>
        </div>
    );
}
