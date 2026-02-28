import { useState, useEffect } from 'react';
import { getSchedules, getSchedule } from '../../api/scheduleService';
import { useToast } from '../../components/Toast/Toast';
import Spinner from '../../components/Spinner/Spinner';
import EmptyState from '../../components/EmptyState/EmptyState';
import GenerateScheduleModal from './GenerateScheduleModal';
import ScheduleGrid from './ScheduleGrid';
import { formatError } from '../../utils/errorUtils';
import styles from './Schedule.module.scss';

export default function Schedule() {
    const toast = useToast();
    const [schedules, setSchedules] = useState([]);
    const [currentSchedule, setCurrentSchedule] = useState(null);
    const [draftSchedule, setDraftSchedule] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isGenerateOpen, setIsGenerateOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchSchedules();
    }, []);

    async function fetchSchedules() {
        setLoading(true);
        try {
            const data = await getSchedules();
            setSchedules(data);
            if (data.length > 0) {
                loadSchedule(data[0].id);
            } else {
                setLoading(false);
            }
        } catch (error) {
            toast({ message: formatError(error), type: 'error' });
            setLoading(false);
        }
    }

    async function loadSchedule(id) {
        setLoading(true);
        setDraftSchedule(null); // Clear draft when switching
        try {
            const data = await getSchedule(id);
            setCurrentSchedule(data);
        } catch (error) {
            toast({ message: formatError(error), type: 'error' });
        } finally {
            setLoading(false);
        }
    }

    const handleGenerated = (previewData) => {
        // previewData comes from the new generate endpoint (not in DB yet)
        setDraftSchedule(previewData);
        setIsGenerateOpen(false);
        toast({ message: 'Schedule preview generated. Review and save to finalize.', type: 'info' });
    };

    const handleDiscard = () => {
        if (window.confirm('Discard this draft? All unsaved changes will be lost.')) {
            setDraftSchedule(null);
        }
    };

    const handleCommit = async () => {
        setIsSaving(true);
        try {
            const saved = await commitSchedule({
                week_start: draftSchedule.week_start,
                week_end: draftSchedule.week_end,
                assignments: draftSchedule.assignments
            });
            toast({ message: 'Schedule saved successfully!', type: 'success' });
            setDraftSchedule(null);
            fetchSchedules(); // Refresh history list
            loadSchedule(saved.id);
        } catch (error) {
            toast({ message: formatError(error), type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    if (loading && schedules.length === 0) {
        return <div className={styles.center}><Spinner /></div>;
    }

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Weekly Schedule</h1>
                    <p className={styles.subtitle}>
                        {currentSchedule
                            ? `Week of ${new Date(currentSchedule.week_start).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`
                            : 'Generate or select a schedule to get started.'}
                    </p>
                </div>

                <div className={styles.actions}>
                    {schedules.length > 0 && (
                        <div className={styles.weekSelector}>
                            <div className={styles.dateDisplay}>
                                <span className={styles.label}>Select Week</span>
                                <select
                                    className={styles.select}
                                    value={currentSchedule?.id || ''}
                                    onChange={(e) => loadSchedule(e.target.value)}
                                >
                                    {schedules.map(s => (
                                        <option key={s.id} value={s.id}>
                                            {new Date(s.week_start).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    <button
                        className={styles.primaryBtn}
                        onClick={() => setIsGenerateOpen(true)}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Generate New Week
                    </button>
                </div>
            </div>

            <div className={styles.legend}>
                <div className={styles.legendItem}>
                    <span className={`${styles.dot} ${styles.am}`}></span>
                    <span>Morning (AM)</span>
                </div>
                <div className={styles.legendItem}>
                    <span className={`${styles.dot} ${styles.lounge}`}></span>
                    <span>Lounge</span>
                </div>
                <div className={styles.legendItem}>
                    <span className={`${styles.dot} ${styles.pm}`}></span>
                    <span>Evening (PM)</span>
                </div>
            </div>

            {currentSchedule?.understaffed?.length > 0 && (
                <div className={styles.understaffedBanner}>
                    <div className={styles.icon}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                    </div>
                    <div className={styles.content}>
                        <h3>Staffing Gaps Detected</h3>
                        <p>There are {currentSchedule.understaffed.length} shifts that couldn't be fully staffed. Use manual overrides to fill these slots.</p>
                    </div>
                </div>
            )}

            {loading ? (
                <div className={styles.center}><Spinner /></div>
            ) : !currentSchedule && !draftSchedule ? (
                <EmptyState
                    title="No schedules yet"
                    description="Automate your staffing by generating a new weekly schedule based on your shift templates and talent availability."
                    action={
                        <button className={styles.primaryBtn} onClick={() => setIsGenerateOpen(true)}>
                            Generate Schedule
                        </button>
                    }
                />
            ) : (
                <ScheduleGrid
                    key={draftSchedule ? 'draft' : currentSchedule?.id}
                    schedule={draftSchedule || currentSchedule}
                    isDraft={!!draftSchedule}
                    onRefresh={() => draftSchedule ? null : loadSchedule(currentSchedule.id)}
                    onUpdateDraft={(updated) => setDraftSchedule(updated)}
                />
            )}

            {draftSchedule && (
                <div className={styles.saveBar}>
                    <div className={styles.barInfo}>
                        <span className={styles.badge}>DRAFT</span>
                        <p>This is a preview. Changes are not saved to the database yet.</p>
                    </div>
                    <div className={styles.barActions}>
                        <button className={styles.discardBtn} onClick={handleDiscard} disabled={isSaving}>
                            Discard
                        </button>
                        <button className={styles.saveBtn} onClick={handleCommit} disabled={isSaving}>
                            {isSaving ? 'Saving...' : 'Save to Database'}
                        </button>
                    </div>
                </div>
            )}

            <GenerateScheduleModal
                isOpen={isGenerateOpen}
                onClose={() => setIsGenerateOpen(false)}
                onSuccess={handleGenerated}
            />
        </div>
    );
}
