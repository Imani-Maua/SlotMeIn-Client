import { useState, useEffect } from 'react';
import {
    getShiftPeriods, getShiftPeriod,
    deleteShiftPeriod, deleteShiftTemplate
} from '../../api/shiftService';
import { useToast } from '../../components/Toast/Toast';
import Spinner from '../../components/Spinner/Spinner';
import EmptyState from '../../components/EmptyState/EmptyState';
import AddPeriodModal from './AddPeriodModal';
import AddTemplateModal from './AddTemplateModal';
import EditPeriodModal from './EditPeriodModal';
import { formatError } from '../../utils/errorUtils';
import styles from './ShiftConfig.module.scss';

// Consistent colour per period name — amber, navy, purple
export const PERIOD_COLOURS = {
    am: 'amber',
    pm: 'navy',
    lounge: 'purple',
};

const PERIOD_LABELS = { am: 'AM Shift', pm: 'PM Shift', lounge: 'Lounge' };

export default function ShiftConfig() {
    const toast = useToast();
    const [periods, setPeriods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedPeriods, setExpandedPeriods] = useState({}); // { [id]: { templates, loading } }

    // Modals
    const [isAddPeriodOpen, setIsAddPeriodOpen] = useState(false);
    const [editingPeriod, setEditingPeriod] = useState(null);   // period obj for editing
    const [addingTemplateTo, setAddingTemplateTo] = useState(null); // period obj for add template

    useEffect(() => { fetchPeriods(); }, []);

    async function fetchPeriods() {
        setLoading(true);
        try {
            const data = await getShiftPeriods();
            setPeriods(data);
        } catch (error) {
            if (error.response?.status !== 404) {
                toast({ message: formatError(error), type: 'error' });
            }
            setPeriods([]);
        } finally {
            setLoading(false);
        }
    }

    async function expandPeriod(period) {
        const alreadyExpanded = expandedPeriods[period.id];
        if (alreadyExpanded) {
            // Collapse
            setExpandedPeriods(prev => {
                const next = { ...prev };
                delete next[period.id];
                return next;
            });
            return;
        }
        // Fetch full period with templates
        setExpandedPeriods(prev => ({ ...prev, [period.id]: { templates: [], loading: true } }));
        try {
            const full = await getShiftPeriod(period.id);
            setExpandedPeriods(prev => ({ ...prev, [period.id]: { templates: full.templates || [], loading: false } }));
        } catch {
            setExpandedPeriods(prev => ({ ...prev, [period.id]: { templates: [], loading: false } }));
        }
    }

    async function handleDeletePeriod(period) {
        if (!window.confirm(`Delete "${PERIOD_LABELS[period.shift_name] || period.shift_name}" and all its templates?`)) return;
        try {
            await deleteShiftPeriod(period.id);
            toast({ message: 'Shift period deleted.', type: 'success' });
            setPeriods(prev => prev.filter(p => p.id !== period.id));
            setExpandedPeriods(prev => { const n = { ...prev }; delete n[period.id]; return n; });
        } catch (error) {
            toast({ message: formatError(error), type: 'error' });
        }
    }

    async function handleDeleteTemplate(periodId, templateId) {
        if (!window.confirm('Delete this template?')) return;
        try {
            await deleteShiftTemplate(templateId);
            toast({ message: 'Template deleted.', type: 'success' });
            setExpandedPeriods(prev => ({
                ...prev,
                [periodId]: {
                    ...prev[periodId],
                    templates: prev[periodId].templates.filter(t => t.id !== templateId)
                }
            }));
        } catch (error) {
            toast({ message: formatError(error), type: 'error' });
        }
    }

    // After adding a new template, refresh the expanded period's template list
    function handleTemplateAdded(periodId, newTemplate) {
        setExpandedPeriods(prev => ({
            ...prev,
            [periodId]: {
                ...prev[periodId],
                templates: [...(prev[periodId]?.templates || []), newTemplate]
            }
        }));
    }

    const existingPeriodNames = periods.map(p => p.shift_name);

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Shift Configuration</h1>
                    <p className={styles.subtitle}>Define shift periods and their templates for scheduling.</p>
                </div>
                {existingPeriodNames.length < 3 && (
                    <button className={styles.addBtn} onClick={() => setIsAddPeriodOpen(true)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Add Shift Period
                    </button>
                )}
            </div>

            {loading ? (
                <div className={styles.center}><Spinner /></div>
            ) : periods.length === 0 ? (
                <EmptyState
                    title="No shift periods configured"
                    description="Add your first shift period to start building your schedule structure."
                    action={
                        <button className={styles.addBtn} onClick={() => setIsAddPeriodOpen(true)}>
                            Add Shift Period
                        </button>
                    }
                />
            ) : (
                <div className={styles.periodList}>
                    {periods.map(period => {
                        const colour = PERIOD_COLOURS[period.shift_name] || 'navy';
                        const expanded = expandedPeriods[period.id];
                        const isOpen = Boolean(expanded);

                        return (
                            <div key={period.id} className={`${styles.periodCard} ${styles[colour]}`}>
                                {/* Period header */}
                                <div className={styles.periodHeader} onClick={() => expandPeriod(period)}>
                                    <div className={styles.periodLeft}>
                                        <div className={`${styles.colourDot} ${styles[`dot_${colour}`]}`} />
                                        <div>
                                            <h2 className={styles.periodName}>
                                                {PERIOD_LABELS[period.shift_name] || period.shift_name}
                                            </h2>
                                            <p className={styles.periodTimes}>
                                                {period.start_time} → {period.end_time}
                                            </p>
                                        </div>
                                    </div>
                                    <div className={styles.periodActions}>
                                        <button
                                            className={styles.iconBtn}
                                            title="Edit period"
                                            onClick={e => {
                                                e.stopPropagation();
                                                setEditingPeriod(period);
                                            }}
                                        >
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                            </svg>
                                        </button>
                                        <button
                                            className={styles.iconBtn}
                                            title="Delete period"
                                            onClick={e => {
                                                e.stopPropagation();
                                                handleDeletePeriod(period);
                                            }}
                                        >
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                <path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                            </svg>
                                        </button>
                                    </div>
                                    <svg
                                        className={`${styles.chevron} ${isOpen ? styles.open : ''}`}
                                        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                                    >
                                        <polyline points="6 9 12 15 18 9" />
                                    </svg>
                                </div>

                                {/* Expanded templates */}
                                {isOpen && (
                                    <div className={styles.templatesSection}>
                                        {expanded.loading ? (
                                            <div className={styles.center}><Spinner /></div>
                                        ) : expanded.templates.length === 0 ? (
                                            <p className={styles.noTemplates}>No templates yet. Add one below.</p>
                                        ) : (
                                            <table className={styles.templateTable}>
                                                <thead>
                                                    <tr>
                                                        <th>Role</th>
                                                        <th>Start</th>
                                                        <th>End</th>
                                                        <th></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {expanded.templates.map(t => (
                                                        <tr key={t.id}>
                                                            <td className={styles.roleCell}>{t.role}</td>
                                                            <td>{t.shift_start}</td>
                                                            <td>{t.shift_end}</td>
                                                            <td>
                                                                <button
                                                                    className={styles.deleteTemplateBtn}
                                                                    onClick={() => handleDeleteTemplate(period.id, t.id)}
                                                                >
                                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                                        <path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                                    </svg>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                        <button
                                            className={styles.addTemplateBtn}
                                            onClick={() => setAddingTemplateTo(period)}
                                        >
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                                            </svg>
                                            Add Template
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <AddPeriodModal
                isOpen={isAddPeriodOpen}
                onClose={() => setIsAddPeriodOpen(false)}
                existingPeriodNames={existingPeriodNames}
                onSuccess={(newPeriod) => {
                    setPeriods(prev => [...prev, newPeriod]);
                }}
            />

            <EditPeriodModal
                period={editingPeriod}
                isOpen={Boolean(editingPeriod)}
                onClose={() => setEditingPeriod(null)}
                onSuccess={(updatedPeriod) => {
                    setPeriods(prev => prev.map(p => p.id === updatedPeriod.id ? updatedPeriod : p));
                }}
            />

            <AddTemplateModal
                period={addingTemplateTo}
                isOpen={Boolean(addingTemplateTo)}
                onClose={() => setAddingTemplateTo(null)}
                onSuccess={(newTemplate) => {
                    if (addingTemplateTo) {
                        handleTemplateAdded(addingTemplateTo.id, newTemplate);
                    }
                }}
            />
        </div>
    );
}
