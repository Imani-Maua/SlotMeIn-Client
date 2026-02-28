import { useState, useEffect, useCallback } from 'react';
import {
    getSchedules, getSchedule, commitSchedule,
    publishSchedule, deleteSchedule
} from '../../api/scheduleService';
import { getTalents } from '../../api/talentService';
import { exportScheduleToPDF } from '../../utils/exportSchedule';
import { useToast } from '../../components/Toast/Toast';
import Spinner from '../../components/Spinner/Spinner';
import EmptyState from '../../components/EmptyState/EmptyState';
import GenerateScheduleModal from './GenerateScheduleModal';
import ScheduleGrid from './ScheduleGrid';
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
    const cls = status === 'final' ? styles.badgeFinal
        : status === 'draft' ? styles.badgeDraft
            : styles.badgeDraft;
    const label = status === 'final' ? 'Final' : 'Draft';
    return <span className={cls}>{label}</span>;
}

// ─── History Table ─────────────────────────────────────────────────────────────
function ScheduleHistoryTable({ schedules, onView, onDelete, onGenerateClick }) {
    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Schedules</h1>
                    <p className={styles.subtitle}>View and manage your weekly schedules.</p>
                </div>
                <button className={styles.primaryBtn} onClick={onGenerateClick}>
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
                                            <button
                                                className={styles.deleteRowBtn}
                                                onClick={() => onDelete(s)}
                                                title="Delete schedule"
                                            >
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

// ─── Main Component ────────────────────────────────────────────────────────────
export default function Schedule() {
    const toast = useToast();
    const [schedules, setSchedules] = useState([]);
    const [talents, setTalents] = useState([]);
    const [currentSchedule, setCurrentSchedule] = useState(null);
    const [draftSchedule, setDraftSchedule] = useState(null);  // in-memory preview
    const [loading, setLoading] = useState(true);
    const [detailLoading, setDetailLoading] = useState(false);
    const [isGenerateOpen, setIsGenerateOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);

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
    }, []);

    useEffect(() => { fetchSchedules(); }, [fetchSchedules]);

    async function openSchedule(id) {
        setDetailLoading(true);
        setDraftSchedule(null);
        try {
            const data = await getSchedule(id);
            setCurrentSchedule(data);
        } catch (error) {
            toast({ message: formatError(error), type: 'error' });
        } finally {
            setDetailLoading(false);
        }
    }

    function goBackToHistory() {
        if (draftSchedule && !window.confirm('Go back? Your unsaved draft will be lost.')) return;
        setCurrentSchedule(null);
        setDraftSchedule(null);
    }

    const handleGenerated = (previewData) => {
        setDraftSchedule(previewData);
        setCurrentSchedule(null);
        setIsGenerateOpen(false);
        toast({ message: 'Schedule generated. Review and save when ready.', type: 'info' });
    };

    const handleDiscard = () => {
        if (window.confirm('Discard this draft? All unsaved changes will be lost.')) {
            setDraftSchedule(null);
            setCurrentSchedule(null);
        }
    };

    // Save the in-memory draft to DB as 'draft' or 'final'
    const handleCommit = async (scheduleStatus) => {
        setIsSaving(true);
        try {
            const saved = await commitSchedule({
                week_start: draftSchedule.week_start,
                week_end: draftSchedule.week_end,
                assignments: draftSchedule.assignments,
            }, scheduleStatus);
            toast({
                message: scheduleStatus === 'draft'
                    ? 'Draft saved — you can continue editing it later.'
                    : 'Schedule published!',
                type: 'success'
            });
            setDraftSchedule(null);
            await fetchSchedules();
            openSchedule(saved.id);
        } catch (error) {
            toast({ message: formatError(error), type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    // Promote a saved draft to final
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

    // Delete a schedule
    const handleDelete = async (schedule) => {
        const label = formatWeekRange(schedule.week_start, schedule.week_end);
        if (!window.confirm(`Delete the schedule for ${label}? This cannot be undone.`)) return;
        try {
            await deleteSchedule(schedule.id);
            toast({ message: 'Schedule deleted.', type: 'success' });
            // If we're currently viewing it, go back to history
            if (currentSchedule?.id === schedule.id) {
                setCurrentSchedule(null);
            }
            await fetchSchedules();
        } catch (error) {
            toast({ message: formatError(error), type: 'error' });
        }
    };

    // ── Initial loading ───────────────────────────────────────────────────────
    if (loading) return <div className={styles.center}><Spinner /></div>;

    // ── History view (default landing) ────────────────────────────────────────
    if (!currentSchedule && !draftSchedule) {
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
                    onSuccess={handleGenerated}
                />
            </>
        );
    }

    // ── Grid detail / draft view ──────────────────────────────────────────────
    const activeSchedule = draftSchedule || currentSchedule;
    const isMemoryDraft = !!draftSchedule;                          // not yet in DB
    const isSavedDraft = currentSchedule?.status === 'draft';       // in DB, not final
    const isFinal = currentSchedule?.status === 'final';

    return (
        <div className={styles.page}>

            {/* ── Header ──────────────────────────────────────────────────── */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <button className={styles.backBtn} onClick={goBackToHistory}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                        All Schedules
                    </button>
                    <div className={styles.titleRow}>
                        <h1 className={styles.title}>
                            {isMemoryDraft
                                ? 'New Draft Schedule'
                                : `Week of ${formatDate(currentSchedule.week_start)}`}
                        </h1>
                        {!isMemoryDraft && <StatusBadge status={currentSchedule.status} />}
                    </div>
                    <p className={styles.subtitle}>{formatWeekRange(activeSchedule.week_start, activeSchedule.week_end)}</p>
                </div>

                <div className={styles.actions}>
                    {/* Download — only for saved schedules */}
                    {!isMemoryDraft && (
                        <button
                            className={styles.secondaryBtn}
                            onClick={() => exportScheduleToPDF(activeSchedule, talents)}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            Download PDF
                        </button>
                    )}

                    {/* Delete — for saved drafts or final schedules viewed in header */}
                    {!isMemoryDraft && (
                        <button
                            className={styles.dangerBtn}
                            onClick={() => handleDelete(currentSchedule)}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
                            </svg>
                            Delete
                        </button>
                    )}

                    {/* Publish draft — only for saved drafts */}
                    {isSavedDraft && (
                        <button
                            className={styles.primaryBtn}
                            onClick={handlePublish}
                            disabled={isPublishing}
                        >
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

            {/* ── Legend ──────────────────────────────────────────────────── */}
            <div className={styles.legend}>
                <div className={styles.legendItem}><span className={`${styles.dot} ${styles.am}`}></span><span>Morning (AM)</span></div>
                <div className={styles.legendItem}><span className={`${styles.dot} ${styles.lounge}`}></span><span>Lounge</span></div>
                <div className={styles.legendItem}><span className={`${styles.dot} ${styles.pm}`}></span><span>Evening (PM)</span></div>
            </div>


            {/* ── Grid ────────────────────────────────────────────────────── */}
            {detailLoading ? (
                <div className={styles.center}><Spinner /></div>
            ) : (
                <ScheduleGrid
                    key={draftSchedule ? 'draft' : currentSchedule?.id}
                    schedule={activeSchedule}
                    isDraft={isMemoryDraft}
                    onRefresh={() => !draftSchedule && openSchedule(currentSchedule.id)}
                    onUpdateDraft={(updated) => setDraftSchedule(updated)}
                />
            )}

            {/* ── In-memory draft save bar ─────────────────────────────── */}
            {isMemoryDraft && (
                <div className={styles.saveBar}>
                    <div className={styles.barInfo}>
                        <span className={styles.badge}>PREVIEW</span>
                        <p>Not saved yet. Save as a draft to continue later, or publish directly.</p>
                    </div>
                    <div className={styles.barActions}>
                        <button className={styles.discardBtn} onClick={handleDiscard} disabled={isSaving}>
                            Discard
                        </button>
                        <button
                            className={styles.draftBtn}
                            onClick={() => handleCommit('draft')}
                            disabled={isSaving}
                        >
                            {isSaving ? 'Saving…' : 'Save Draft'}
                        </button>
                        <button
                            className={styles.saveBtn}
                            onClick={() => handleCommit('final')}
                            disabled={isSaving}
                        >
                            {isSaving ? 'Saving…' : 'Publish Final'}
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
