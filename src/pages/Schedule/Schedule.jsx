import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
    getSchedules, getSchedule,
    publishSchedule, deleteSchedule,
} from '../../api/scheduleService';
import { getTalents } from '../../api/talentService';
import { invalidate, invalidatePrefixed } from '../../utils/apiCache';
import { exportScheduleToPDF } from '../../utils/exportSchedule';
import { useToast } from '../../components/Toast/Toast';
import { useJob } from '../../context/JobContext';
import Spinner from '../../components/Spinner/Spinner';
import EmptyState from '../../components/EmptyState/EmptyState';
import GenerateScheduleModal from './GenerateScheduleModal';
import ScheduleGrid from './ScheduleGrid';
import DraftScheduleGrid from './DraftScheduleGrid';
import { formatError } from '../../utils/errorUtils';
import styles from './Schedule.module.scss';

function formatWeekRange(start, end) {
    const opts = { day: 'numeric', month: 'short' };
    const s = new Date(start).toLocaleDateString('en-GB', opts);
    const e = new Date(end).toLocaleDateString('en-GB', { ...opts, year: 'numeric' });
    return `${s} – ${e}`;
}

function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function StatusBadge({ status }) {
    const cls = status === 'final' ? styles.badgeFinal : styles.badgeDraft;
    return <span className={cls}>{status === 'final' ? 'Final' : 'Draft'}</span>;
}

function ScheduleHistoryTable({ schedules, onView, onDelete, onGenerateClick }) {
    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Schedules</h1>
                    <p className={styles.subtitle}>View and manage your weekly schedules.</p>
                </div>
                <button data-tutorial="generate-schedule" className={styles.primaryBtn} onClick={onGenerateClick}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Generate New Week
                </button>
            </div>

            {schedules.length === 0 ? (
                <EmptyState
                    title="No schedules yet"
                    description="Generate your first weekly schedule based on your shift templates and talent availability."
                    action={<button className={styles.primaryBtn} onClick={onGenerateClick}>Generate Schedule</button>}
                />
            ) : (
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Week</th>
                                <th>Start Date</th>
                                <th>End Date</th>
                                <th>Status</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {schedules.map(s => (
                                <tr key={s.id}>
                                    <td>
                                        <div className={styles.weekCell}>
                                            <div className={styles.weekIcon}>
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                                                </svg>
                                            </div>
                                            <span className={styles.weekRange}>{formatWeekRange(s.week_start, s.week_end)}</span>
                                        </div>
                                    </td>
                                    <td>{formatDate(s.week_start)}</td>
                                    <td>{formatDate(s.week_end)}</td>
                                    <td><StatusBadge status={s.status} /></td>
                                    <td>
                                        <div className={styles.rowActions}>
                                            <button className={styles.viewBtn} onClick={() => onView(s.id)}>
                                                View
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                    <polyline points="9 18 15 12 9 6" />
                                                </svg>
                                            </button>
                                            <button className={styles.deleteRowBtn} onClick={() => onDelete(s)} title="Delete schedule">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default function Schedule() {
    const toast = useToast();
    const location = useLocation();
    const { setPendingJobId, notification, setNotification } = useJob();

    const [schedules,       setSchedules]       = useState([]);
    const [talents,         setTalents]         = useState([]);
    const [currentSchedule, setCurrentSchedule] = useState(null);
    const [loading,         setLoading]         = useState(true);
    const [detailLoading,   setDetailLoading]   = useState(false);
    const [isGenerateOpen,  setIsGenerateOpen]  = useState(false);
    const [isPublishing,    setIsPublishing]    = useState(false);

    const fetchSchedules = useCallback(async () => {
        setLoading(true);
        try {
            const [schedulesData, talentsData] = await Promise.all([getSchedules(), getTalents()]);
            setSchedules(schedulesData);
            setTalents(talentsData.filter(t => t.is_active));
        } catch (error) {
            toast({ message: formatError(error), type: 'error' });
        } finally {
            setLoading(false);
        }
    }, []); // eslint-disable-line

    const openSchedule = useCallback(async (id) => {
        setDetailLoading(true);
        try {
            invalidate(`schedules:${id}`);
            const data = await getSchedule(id);
            setCurrentSchedule(data);
        } catch (error) {
            toast({ message: formatError(error), type: 'error' });
        } finally {
            setDetailLoading(false);
        }
    }, []); // eslint-disable-line

    useEffect(() => { fetchSchedules(); }, [fetchSchedules]);

    // Open draft when navigated here from the banner — watches location.state so it fires
    // even when already on this page (navigate() with new state updates location without unmounting)
    useEffect(() => {
        const id = location.state?.openScheduleId;
        if (!id) return;
        invalidatePrefixed('schedules:');  // bust list so history view refreshes on next visit
        openSchedule(id);
        window.history.replaceState({}, document.title, location.pathname);
    }, [location.state]); // eslint-disable-line

    // When job finishes and user is already on this page, open the draft immediately.
    // Do NOT call fetchSchedules() here — it sets loading=true which blanks the detail view.
    useEffect(() => {
        if (notification?.type !== 'done' || !notification?.scheduleId) return;
        invalidatePrefixed('schedules:');
        openSchedule(notification.scheduleId);
        setNotification(null);
    }, [notification]); // eslint-disable-line

    function goBackToHistory() {
        setCurrentSchedule(null);
    }

    const handleJobStarted = (jobId) => {
        setPendingJobId(jobId);
        toast({ message: 'Generating schedule in the background…', type: 'info' });
    };

    const handlePublish = async () => {
        if (!currentSchedule) return;
        setIsPublishing(true);
        try {
            const updated = await publishSchedule(currentSchedule.id);
            toast({ message: 'Schedule published!', type: 'success' });
            setCurrentSchedule(updated);
            await fetchSchedules();
        } catch (error) {
            toast({ message: formatError(error), type: 'error' });
        } finally {
            setIsPublishing(false);
        }
    };

    const handleDelete = async (schedule) => {
        const label = formatWeekRange(schedule.week_start, schedule.week_end);
        if (!window.confirm(`Delete the schedule for ${label}? This cannot be undone.`)) return;
        try {
            await deleteSchedule(schedule.id);
            toast({ message: 'Schedule deleted.', type: 'success' });
            if (currentSchedule?.id === schedule.id) setCurrentSchedule(null);
            await fetchSchedules();
        } catch (error) {
            toast({ message: formatError(error), type: 'error' });
        }
    };

    if (loading) return <div className={styles.center}><Spinner /></div>;

    // ── History view ──────────────────────────────────────────────────────────
    if (!currentSchedule) {
        return (
            <>
                <ScheduleHistoryTable
                    schedules={schedules}
                    onView={openSchedule}
                    onDelete={handleDelete}
                    onGenerateClick={() => setIsGenerateOpen(true)}
                />
                <GenerateScheduleModal
                    isOpen={isGenerateOpen}
                    onClose={() => setIsGenerateOpen(false)}
                    onJobStarted={handleJobStarted}
                />
            </>
        );
    }

    // ── Detail view ───────────────────────────────────────────────────────────
    const isSavedDraft = currentSchedule.status === 'draft';

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <button className={styles.backBtn} onClick={goBackToHistory}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                        All Schedules
                    </button>
                    <div className={styles.titleRow}>
                        <h1 className={styles.title}>Week of {formatDate(currentSchedule.week_start)}</h1>
                        <StatusBadge status={currentSchedule.status} />
                    </div>
                    <p className={styles.subtitle}>{formatWeekRange(currentSchedule.week_start, currentSchedule.week_end)}</p>
                </div>

                <div className={styles.actions}>
                    <button className={styles.secondaryBtn} onClick={() => exportScheduleToPDF(currentSchedule, talents)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        Download PDF
                    </button>

                    <button className={styles.dangerBtn} onClick={() => handleDelete(currentSchedule)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
                        </svg>
                        Delete
                    </button>

                    {isSavedDraft && (
                        <button className={styles.primaryBtn} onClick={handlePublish} disabled={isPublishing}>
                            {isPublishing ? 'Publishing…' : 'Publish Final'}
                        </button>
                    )}

                    <button className={styles.primaryBtn} onClick={() => setIsGenerateOpen(true)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Generate New Week
                    </button>
                </div>
            </div>

            {detailLoading ? (
                <div className={styles.center}><Spinner /></div>
            ) : isSavedDraft ? (
                <DraftScheduleGrid
                    key={`draft-${currentSchedule.id}`}
                    schedule={currentSchedule}
                    isDraft={false}
                    talents={talents}
                    onUpdateDraft={null}
                    onRefresh={() => openSchedule(currentSchedule.id)}
                />
            ) : (
                <>
                    <div className={styles.legend}>
                        <div className={styles.legendItem}><span className={`${styles.dot} ${styles.am}`}></span><span>Morning (AM)</span></div>
                        <div className={styles.legendItem}><span className={`${styles.dot} ${styles.lounge}`}></span><span>Lounge</span></div>
                        <div className={styles.legendItem}><span className={`${styles.dot} ${styles.pm}`}></span><span>Evening (PM)</span></div>
                    </div>
                    <ScheduleGrid
                        key={currentSchedule.id}
                        schedule={currentSchedule}
                        isDraft={false}
                        onRefresh={() => openSchedule(currentSchedule.id)}
                        onUpdateDraft={null}
                    />
                </>
            )}

            <GenerateScheduleModal
                isOpen={isGenerateOpen}
                onClose={() => setIsGenerateOpen(false)}
                onJobStarted={handleJobStarted}
            />
        </div>
    );
}
