import { useState, useEffect, useMemo } from 'react';
import { getTalents } from '../../api/talentService';
import { getConstraints, deleteConstraint } from '../../api/constraintService';
import { useToast } from '../../components/Toast/Toast';
import Spinner from '../../components/Spinner/Spinner';
import EmptyState from '../../components/EmptyState/EmptyState';
import AddConstraintModal from '../Talents/AddConstraintModal';
import styles from './Constraints.module.scss';

const CONSTRAINT_TYPE_LABELS = {
    availability: 'Working Days',
    'shift restriction': 'Allowed Shifts',
    combination: 'Specific Schedule',
};

const CONSTRAINT_TYPE_ICONS = {
    availability: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
        </svg>
    ),
    'shift restriction': (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
        </svg>
    ),
    combination: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
    ),
};

export default function Constraints() {
    const toast = useToast();

    // All talents
    const [talents, setTalents] = useState([]);
    const [talentsLoading, setTalentsLoading] = useState(true);

    // Map of talentId → constraints array
    const [constraintsMap, setConstraintsMap] = useState({});
    const [constraintsLoading, setConstraintsLoading] = useState(false);

    // Search / filter
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all'); // 'all' | 'constrained' | 'unconstrained'

    // Expanded talent rows
    const [expandedIds, setExpandedIds] = useState(new Set());

    // Deleting state
    const [deletingId, setDeletingId] = useState(null);

    // Add constraint modal
    const [addModalTalent, setAddModalTalent] = useState(null);

    // ─── Load Data ────────────────────────────────────────────────────────────

    useEffect(() => {
        fetchAll();
    }, []);

    async function fetchAll() {
        setTalentsLoading(true);
        try {
            const talentData = await getTalents();
            setTalents(talentData);
            await fetchAllConstraints(talentData);
        } catch (err) {
            toast({ message: 'Failed to load talents', type: 'error' });
        } finally {
            setTalentsLoading(false);
        }
    }

    async function fetchAllConstraints(talentList) {
        setConstraintsLoading(true);
        const results = await Promise.allSettled(
            talentList.map(t => getConstraints({ talent_id: t.id }))
        );
        const map = {};
        talentList.forEach((t, i) => {
            const result = results[i];
            if (result.status === 'fulfilled') {
                map[t.id] = result.value;
            } else if (result.reason?.response?.status === 404) {
                map[t.id] = [];
            } else {
                map[t.id] = [];
            }
        });
        setConstraintsMap(map);
        setConstraintsLoading(false);
    }

    async function refreshConstraintsForTalent(talent) {
        try {
            const data = await getConstraints({ talent_id: talent.id });
            setConstraintsMap(prev => ({ ...prev, [talent.id]: data }));
        } catch (err) {
            if (err.response?.status === 404) {
                setConstraintsMap(prev => ({ ...prev, [talent.id]: [] }));
            }
        }
    }

    async function handleDelete(talentId, constraintId) {
        if (!window.confirm('Delete this constraint and all its rules?')) return;
        setDeletingId(constraintId);
        try {
            await deleteConstraint(constraintId);
            toast({ message: 'Constraint removed.', type: 'success' });
            setConstraintsMap(prev => ({
                ...prev,
                [talentId]: prev[talentId].filter(c => c.id !== constraintId),
            }));
        } catch {
            toast({ message: 'Failed to delete constraint.', type: 'error' });
        } finally {
            setDeletingId(null);
        }
    }

    function toggleExpand(id) {
        setExpandedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }

    // ─── Derived / Filtered Talents ───────────────────────────────────────────

    const filteredTalents = useMemo(() => {
        return talents.filter(t => {
            const name = `${t.firstname} ${t.lastname}`.toLowerCase();
            const matchesSearch = name.includes(search.toLowerCase());
            const constraints = constraintsMap[t.id] ?? [];
            const hasConstraints = constraints.length > 0;
            const matchesFilter =
                filter === 'all' ||
                (filter === 'constrained' && hasConstraints) ||
                (filter === 'unconstrained' && !hasConstraints);
            return matchesSearch && matchesFilter;
        });
    }, [talents, search, filter, constraintsMap]);

    const constrainedCount = useMemo(
        () => talents.filter(t => (constraintsMap[t.id] ?? []).length > 0).length,
        [talents, constraintsMap]
    );

    // ─── Render ───────────────────────────────────────────────────────────────

    if (talentsLoading) return <Spinner fullScreen />;

    return (
        <div className={styles.page}>
            {/* ── Header ───────────────────────────────────────────────────── */}
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Constraints</h1>
                    <p className={styles.subtitle}>
                        Manage availability rules and scheduling constraints for your team.
                    </p>
                </div>
                <button
                    id="add-constraint-btn"
                    className={styles.addBtn}
                    onClick={() => setAddModalTalent('pick')}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add Constraint
                </button>
            </div>

            {/* ── Summary Stats ─────────────────────────────────────────────── */}
            <div className={styles.statsRow}>
                <div className={styles.statCard}>
                    <span className={styles.statValue}>{talents.length}</span>
                    <span className={styles.statLabel}>Total Talents</span>
                </div>
                <div className={styles.statCard}>
                    <span className={`${styles.statValue} ${styles.statValueWarning}`}>{constrainedCount}</span>
                    <span className={styles.statLabel}>With Constraints</span>
                </div>
                <div className={styles.statCard}>
                    <span className={`${styles.statValue} ${styles.statValueSuccess}`}>{talents.length - constrainedCount}</span>
                    <span className={styles.statLabel}>Fully Available</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statValue}>
                        {Object.values(constraintsMap).reduce((sum, arr) => sum + arr.length, 0)}
                    </span>
                    <span className={styles.statLabel}>Total Rules</span>
                </div>
            </div>

            {/* ── Filters ──────────────────────────────────────────────────── */}
            <div className={styles.filtersCard}>
                <div className={styles.searchGroup}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                        id="constraint-search"
                        type="text"
                        placeholder="Search talents..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                <div className={styles.filterPills}>
                    {[
                        { value: 'all', label: 'All Talents' },
                        { value: 'constrained', label: 'Has Constraints' },
                        { value: 'unconstrained', label: 'No Constraints' },
                    ].map(opt => (
                        <button
                            key={opt.value}
                            className={`${styles.filterPill} ${filter === opt.value ? styles.filterPillActive : ''}`}
                            onClick={() => setFilter(opt.value)}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Talent Constraint Cards ───────────────────────────────────── */}
            {constraintsLoading && talents.length > 0 ? (
                <div className={styles.centerSpinner}><Spinner /></div>
            ) : filteredTalents.length === 0 ? (
                <EmptyState
                    icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>}
                    title={search || filter !== 'all' ? 'No matches found' : 'No talents yet'}
                    description={search || filter !== 'all' ? 'Try adjusting your search or filter.' : 'Add talents first to manage their constraints.'}
                />
            ) : (
                <div className={styles.talentList}>
                    {filteredTalents.map(talent => {
                        const constraints = constraintsMap[talent.id] ?? [];
                        const isExpanded = expandedIds.has(talent.id);
                        const hasConstraints = constraints.length > 0;
                        const existingTypes = constraints.map(c => c.type);

                        return (
                            <div
                                key={talent.id}
                                className={`${styles.talentCard} ${hasConstraints ? styles.talentCardConstrained : ''}`}
                            >
                                {/* Talent Row */}
                                <div className={styles.talentRow}>
                                    {/* Avatar */}
                                    <div className={styles.avatar}>
                                        {talent.firstname[0]}{talent.lastname[0]}
                                    </div>

                                    {/* Info */}
                                    <div className={styles.talentInfo}>
                                        <span className={styles.talentName}>
                                            {talent.firstname} {talent.lastname}
                                        </span>
                                        <div className={styles.talentMeta}>
                                            <span className={styles.metaBadge}>{talent.tal_role}</span>
                                            <span className={styles.metaDot} />
                                            <span className={styles.metaText}>{talent.contract_type}</span>
                                        </div>
                                    </div>

                                    {/* Constraint count badge */}
                                    <div className={styles.countArea}>
                                        {hasConstraints ? (
                                            <span className={styles.constraintCount}>
                                                {constraints.length} rule{constraints.length !== 1 ? 's' : ''}
                                            </span>
                                        ) : (
                                            <span className={styles.noConstraintsBadge}>Fully available</span>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className={styles.rowActions}>
                                        <button
                                            id={`add-constraint-${talent.id}`}
                                            className={styles.addRuleBtn}
                                            onClick={() => setAddModalTalent(talent)}
                                            disabled={existingTypes.length >= 3}
                                            title={existingTypes.length >= 3 ? 'All constraint types set' : 'Add constraint'}
                                        >
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                                            </svg>
                                            Add Rule
                                        </button>

                                        {hasConstraints && (
                                            <button
                                                id={`expand-${talent.id}`}
                                                className={`${styles.expandBtn} ${isExpanded ? styles.expandBtnOpen : ''}`}
                                                onClick={() => toggleExpand(talent.id)}
                                                aria-label={isExpanded ? 'Collapse' : 'Expand'}
                                            >
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                                    <polyline points="6 9 12 15 18 9" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* ── Inline Constraint Preview (always visible for constrained talents) */}
                                {hasConstraints && !isExpanded && (
                                    <div className={styles.constraintPreviews}>
                                        {constraints.map(c => (
                                            <div key={c.id} className={styles.previewChip}>
                                                <span className={styles.previewIcon}>
                                                    {CONSTRAINT_TYPE_ICONS[c.type]}
                                                </span>
                                                <span className={styles.previewLabel}>
                                                    {CONSTRAINT_TYPE_LABELS[c.type]}
                                                </span>
                                                <span className={styles.previewRules}>
                                                    {c.rules?.map((r, i) => (
                                                        <span key={i} className={styles.rulePill}>
                                                            {r.day && r.shifts
                                                                ? `${r.day} — ${r.shifts.toUpperCase()}`
                                                                : r.day || r.shifts?.toUpperCase()}
                                                        </span>
                                                    ))}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* ── Expanded Constraint Detail ────────────────────────────────── */}
                                {hasConstraints && isExpanded && (
                                    <div className={styles.expandedConstraints}>
                                        {constraints.map(c => (
                                            <div key={c.id} className={styles.constraintBlock}>
                                                <div className={styles.constraintBlockHeader}>
                                                    <div className={styles.constraintBlockIcon}>
                                                        {CONSTRAINT_TYPE_ICONS[c.type]}
                                                    </div>
                                                    <div className={styles.constraintBlockInfo}>
                                                        <span className={styles.constraintBlockType}>
                                                            {CONSTRAINT_TYPE_LABELS[c.type]}
                                                        </span>
                                                        <span className={styles.constraintBlockSub}>
                                                            {c.type === 'availability' && 'Available on:'}
                                                            {c.type === 'shift restriction' && 'Allowed shifts:'}
                                                            {c.type === 'combination' && 'Specific schedule:'}
                                                        </span>
                                                    </div>
                                                    <button
                                                        id={`delete-constraint-${c.id}`}
                                                        className={styles.deleteBtn}
                                                        onClick={() => handleDelete(talent.id, c.id)}
                                                        disabled={deletingId === c.id}
                                                        title="Delete constraint"
                                                    >
                                                        {deletingId === c.id ? (
                                                            <span className={styles.deletingDots}>···</span>
                                                        ) : (
                                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                                <path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                </div>
                                                <div className={styles.rulesList}>
                                                    {c.rules?.map((r, i) => (
                                                        <span key={i} className={styles.rulePillExpanded}>
                                                            <span className={styles.rulePillDot} />
                                                            {r.day && r.shifts
                                                                ? `${r.day} — ${r.shifts.toUpperCase()}`
                                                                : r.day || r.shifts?.toUpperCase()}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Talent Picker Modal (when "Add Constraint" from header) ──── */}
            {addModalTalent === 'pick' && (
                <TalentPickerModal
                    talents={talents}
                    constraintsMap={constraintsMap}
                    onPick={talent => setAddModalTalent(talent)}
                    onClose={() => setAddModalTalent(null)}
                />
            )}

            {/* ── Add Constraint Modal ─────────────────────────────────────── */}
            {addModalTalent && addModalTalent !== 'pick' && (
                <AddConstraintModal
                    talent={addModalTalent}
                    existingConstraintTypes={(constraintsMap[addModalTalent.id] ?? []).map(c => c.type)}
                    isOpen={true}
                    onClose={() => setAddModalTalent(null)}
                    onSuccess={() => {
                        refreshConstraintsForTalent(addModalTalent);
                        setExpandedIds(prev => new Set([...prev, addModalTalent.id]));
                        setAddModalTalent(null);
                    }}
                />
            )}
        </div>
    );
}

// ─── Talent Picker Modal ─────────────────────────────────────────────────────

function TalentPickerModal({ talents, constraintsMap, onPick, onClose }) {
    const [search, setSearch] = useState('');

    const filtered = talents.filter(t =>
        `${t.firstname} ${t.lastname}`.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className={styles.pickerOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
            <div className={styles.pickerModal}>
                <div className={styles.pickerHeader}>
                    <h2 className={styles.pickerTitle}>Select a Talent</h2>
                    <button className={styles.pickerClose} onClick={onClose} aria-label="Close">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <div className={styles.pickerSearch}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                        id="picker-search"
                        type="text"
                        placeholder="Search talents..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        autoFocus
                    />
                </div>

                <div className={styles.pickerList}>
                    {filtered.length === 0 ? (
                        <p className={styles.pickerEmpty}>No talents found.</p>
                    ) : (
                        filtered.map(talent => {
                            const constraintCount = (constraintsMap[talent.id] ?? []).length;
                            const isFull = constraintCount >= 3;
                            return (
                                <button
                                    key={talent.id}
                                    id={`pick-talent-${talent.id}`}
                                    className={`${styles.pickerItem} ${isFull ? styles.pickerItemFull : ''}`}
                                    onClick={() => !isFull && onPick(talent)}
                                    disabled={isFull}
                                    title={isFull ? 'All constraint types already set' : ''}
                                >
                                    <div className={styles.pickerAvatar}>
                                        {talent.firstname[0]}{talent.lastname[0]}
                                    </div>
                                    <div className={styles.pickerItemInfo}>
                                        <span className={styles.pickerItemName}>
                                            {talent.firstname} {talent.lastname}
                                        </span>
                                        <span className={styles.pickerItemMeta}>
                                            {talent.tal_role} · {talent.contract_type}
                                        </span>
                                    </div>
                                    <div className={styles.pickerItemRight}>
                                        {isFull ? (
                                            <span className={styles.pickerFullBadge}>All set</span>
                                        ) : constraintCount > 0 ? (
                                            <span className={styles.pickerCountBadge}>
                                                {constraintCount} rule{constraintCount !== 1 ? 's' : ''}
                                            </span>
                                        ) : (
                                            <span className={styles.pickerNoneBadge}>None</span>
                                        )}
                                        {!isFull && (
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                <polyline points="9 18 15 12 9 6" />
                                            </svg>
                                        )}
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
