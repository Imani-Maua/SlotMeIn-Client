import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTalents } from '../../api/talentService';
import { getShiftPeriods, getShiftTemplates } from '../../api/shiftService';
import Spinner from '../../components/Spinner/Spinner';
import styles from './Dashboard.module.scss';
import { useAuth } from '../../context/AuthContext';

export default function Dashboard() {
    const navigate = useNavigate();
    const { role, firstname } = useAuth();

    const [stats, setStats] = useState({
        talents: 0,
        periods: 0,
        templates: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                // Fetch in parallel
                const [talentsRes, periodsRes, templatesRes] = await Promise.all([
                    getTalents().catch(() => []), // Catch errors so one failure doesn't break all stats
                    getShiftPeriods().catch(() => []),
                    getShiftTemplates().catch(() => [])
                ]);

                setStats({
                    talents: talentsRes.filter(t => t.is_active).length,
                    periods: periodsRes.length,
                    templates: templatesRes.length
                });
            } catch (err) {
                console.error('Failed to load dashboard stats', err);
            } finally {
                setLoading(false);
            }
        }

        fetchStats();
    }, []);

    const statCards = [
        {
            label: 'Active Talents',
            value: stats.talents,
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                </svg>
            )
        },
        {
            label: 'Shift Periods',
            value: stats.periods,
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
            )
        },
        {
            label: 'Shift Templates',
            value: stats.templates,
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                </svg>
            )
        }
    ];

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Welcome back, {firstname}! 👋</h1>
                    <p className={styles.subtitle}>Here is what's happening in SlotMeIn today.</p>
                </div>
                <button className={styles.generateBtn} onClick={() => navigate('/schedule')}>
                    Generate Schedule
                </button>
            </div>

            {loading ? (
                <div className={styles.loader}>
                    <Spinner size="lg" />
                </div>
            ) : (
                <>
                    {/* Stats Grid */}
                    <div className={styles.statsGrid}>
                        {statCards.map((stat, i) => (
                            <div key={i} className={styles.statCard}>
                                <div className={styles.statIcon}>{stat.icon}</div>
                                <div className={styles.statInfo}>
                                    <span className={styles.statValue}>{stat.value}</span>
                                    <span className={styles.statLabel}>{stat.label}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Quick Actions */}
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>Quick Actions</h2>
                        <div className={styles.actionsGrid}>
                            <div className={styles.actionCard} onClick={() => navigate('/talents')}>
                                <h3>Manage Talents</h3>
                                <p>Update staff details, set availability, and manage constraints.</p>
                            </div>
                            <div className={styles.actionCard} onClick={() => navigate('/shifts')}>
                                <h3>Configure Shifts</h3>
                                <p>Define shift periods and template times for scheduling.</p>
                            </div>
                            {role === 'superuser' && (
                                <div className={styles.actionCard} onClick={() => navigate('/admin/users')}>
                                    <h3>User Admin</h3>
                                    <p>Invite new managers and control system access.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
