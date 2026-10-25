import { useState, useMemo } from 'react';
import { createAssignment, deleteAssignment } from '../../api/scheduleService';
import { useToast } from '../../components/Toast/Toast';
import SlotAssignModal from './SlotAssignModal';
import { formatError } from '../../utils/errorUtils';
import styles from './DraftScheduleGrid.module.scss';

let _tempIdCounter = 0;
const nextTempId = () => `temp-${++_tempIdCounter}`;

const SHIFT_PERIODS = [
    { id: 'am',     label: 'Morning (AM)',  start: '06:00', end: '16:00' },
    { id: 'lounge', label: 'Lounge',        start: '11:00', end: '23:59' },
    { id: 'pm',     label: 'Evening (PM)',  start: '15:00', end: '23:59' },
];

function getWeekDays(weekStart) {
    if (!weekStart) return [];
    const [year, month, day] = weekStart.split('-').map(Number);
    const days = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(year, month - 1, day + i);
        days.push({
            iso: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
            label: d.toLocaleDateString('en-GB', { weekday: 'short' }),
            date:  d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        });
    }
    return days;
}

export default function DraftScheduleGrid({ schedule, isDraft, talents, onUpdateDraft, onRefresh }) {
    const toast = useToast();
    const [slotModal,       setSlotModal]       = useState(null);
    const [localAssignments, setLocalAssignments] = useState(schedule?.assignments || []);
    const [expandedGroups,  setExpandedGroups]  = useState({});
    const [focusedTalentId, setFocusedTalentId] = useState(null);

    const weekDays = useMemo(() => getWeekDays(schedule?.week_start), [schedule?.week_start]);

    // staffingLookup: `${date}|${shift_name}|${role}` → {required, assigned}
    // Prefers staffing_requirements (all slots) over understaffed (shortfalls only).
    const staffingLookup = useMemo(() => {
        const lookup = {};
        const source = (schedule.staffing_requirements?.length ? schedule.staffing_requirements : schedule.understaffed) || [];
        source.forEach(u => {
            const parts = (u.shift_id || '').split('__');
            if (parts.length < 4) return;
            const date = parts[1];
            lookup[`${date}|${u.shift_name}|${u.role}`] = {
                required: u.required,
                assigned: u.assigned,
            };
        });
        return lookup;
    }, [schedule.staffing_requirements, schedule.understaffed]);

    // cellMap: `${date}|${shift_id}` → assignment[]
    const cellMap = useMemo(() => {
        const map = {};
        localAssignments.forEach(a => {
            const key = `${a.date_of}|${(a.shift_name || '').toLowerCase()}`;
            if (!map[key]) map[key] = [];
            map[key].push(a);
        });
        return map;
    }, [localAssignments]);

    // rolesPerCell: `${date}|${shift_id}` → Set<role>
    // Merges roles from actual assignments and from understaffed (so 0-assigned roles still show)
    const rolesPerCell = useMemo(() => {
        const map = {};
        localAssignments.forEach(a => {
            const role = resolveRole(a);
            if (!role) return;
            const key = `${a.date_of}|${(a.shift_name || '').toLowerCase()}`;
            if (!map[key]) map[key] = new Set();
            map[key].add(role);
        });
        (schedule.understaffed || []).forEach(u => {
            const parts = (u.shift_id || '').split('__');
            if (parts.length < 4) return;
            const key = `${parts[1]}|${u.shift_name}`;
            if (!map[key]) map[key] = new Set();
            map[key].add(u.role);
        });
        return map;
    }, [localAssignments, schedule.understaffed]); // eslint-disable-line react-hooks/exhaustive-deps

    function resolveRole(a) {
        if (a.tal_role) return a.tal_role;
        return talents.find(t => t.id === a.talent_id)?.tal_role || null;
    }

    function getLastName(a) {
        const t = talents.find(t => t.id === a.talent_id);
        return t ? t.lastname : `#${a.talent_id}`;
    }

    function toggleGroup(key) {
        setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }));
    }

    function openSlotModal(shiftId, dateOf) {
        const key = `${dateOf}|${shiftId}`;
        const existing = (cellMap[key] || []).map(a => a.talent_id);
        setSlotModal({ shiftId, dateOf, existingIds: existing });
    }

    async function handleAssign(assignment) {
        if (isDraft) {
            const next = [...localAssignments, { ...assignment, id: nextTempId() }];
            setLocalAssignments(next);
            onUpdateDraft?.({ ...schedule, assignments: next });
        } else {
            try {
                const endTime = assignment.end_time === '23:59' ? '23:59:00' : assignment.end_time + ':00';
                const created = await createAssignment({
                    talent_id:   assignment.talent_id,
                    date_of:     assignment.date_of,
                    start_time:  assignment.start_time + ':00',
                    end_time:    endTime,
                    shift_name:  assignment.shift_name,
                    schedule_id: schedule.id,
                });
                toast({ message: 'Assignment added.', type: 'success' });
                const next = [...localAssignments, {
                    ...created,
                    talent_name: assignment.talent_name,
                    tal_role:    assignment.tal_role,
                }];
                setLocalAssignments(next);
                onRefresh?.();
            } catch (e) {
                toast({ message: formatError(e), type: 'error' });
            }
        }
    }

    async function handleRemove(assignment) {
        if (!window.confirm(`Remove ${getLastName(assignment)} from this slot?`)) return;
        if (isDraft || String(assignment.id).startsWith('temp-')) {
            const next = localAssignments.filter(a => a.id !== assignment.id);
            setLocalAssignments(next);
            onUpdateDraft?.({ ...schedule, assignments: next });
        } else {
            try {
                await deleteAssignment(assignment.id);
                toast({ message: 'Removed.', type: 'success' });
                setLocalAssignments(prev => prev.filter(a => a.id !== assignment.id));
                onRefresh?.();
            } catch (e) {
                toast({ message: formatError(e), type: 'error' });
            }
        }
    }

    // Color role header rows by required headcount using absolute thresholds.
    // 1–2 = blue (quiet), 3–4 = amber (moderate), 5+ = red (busy).
    function requirementColor(required) {
        if (!required || required <= 0) return undefined;
        if (required <= 2) return 'rgba(59,130,246,0.13)';
        if (required <= 4) return 'rgba(245,158,11,0.18)';
        return 'rgba(239,68,68,0.18)';
    }

    const focusedTalent = useMemo(
        () => talents.find(t => t.id === focusedTalentId) || null,
        [focusedTalentId, talents]
    );
    const focusedAssignments = useMemo(
        () => localAssignments.filter(a => a.talent_id === focusedTalentId),
        [focusedTalentId, localAssignments]
    );

    return (
        <div className={styles.wrapper}>
            <div className={styles.tableScroll}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th className={styles.shiftHeader}>Shift</th>
                            {weekDays.map(d => (
                                <th key={d.iso} className={styles.dayHeader}>
                                    <span className={styles.dayName}>{d.label}</span>
                                    <span className={styles.dayDate}>{d.date}</span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {SHIFT_PERIODS.map(shift => (
                            <tr key={shift.id}>
                                <td className={styles.shiftLabel}>
                                    <div className={styles.shiftName}>{shift.label}</div>
                                    <div className={styles.shiftTimes}>{shift.start}–{shift.end}</div>
                                </td>

                                {weekDays.map(day => {
                                    const cellKey   = `${day.iso}|${shift.id}`;
                                    const cellAssignments = cellMap[cellKey] || [];
                                    const cellRoles = Array.from(rolesPerCell[cellKey] || new Set()).sort();

                                    return (
                                        <td key={day.iso} className={styles.cell}>
                                            <div className={styles.cellContent}>

                                                {cellRoles.map(role => {
                                                    const groupKey  = `${cellKey}|${role}`;
                                                    const isOpen    = expandedGroups[groupKey] ?? false;
                                                    const roleRows  = cellAssignments.filter(a => resolveRole(a) === role);
                                                    const staffing  = staffingLookup[`${day.iso}|${shift.id}|${role}`];

                                                    const required  = staffing ? staffing.required : roleRows.length;
                                                    const actual    = roleRows.length;
                                                    const under     = actual < required;

                                                    return (
                                                        <div key={role} className={styles.roleGroup}>
                                                            <button
                                                                className={`${styles.roleHeader} ${under ? styles.roleHeaderUnder : ''}`}
                                                                style={{ background: under ? undefined : requirementColor(staffing?.required) }}
                                                                onClick={() => toggleGroup(groupKey)}
                                                            >
                                                                <span className={styles.roleChevron}>{isOpen ? '▾' : '▸'}</span>
                                                                <span className={styles.roleName}>{role}</span>
                                                                <span className={`${styles.roleCount} ${under ? styles.roleCountUnder : ''}`}>
                                                                    {actual}/{required}
                                                                </span>
                                                            </button>

                                                            {isOpen && (
                                                                <div className={styles.roleNames}>
                                                                    {roleRows.map(a => (
                                                                        <div
                                                                            key={a.id}
                                                                            className={`${styles.nameRow} ${focusedTalentId === a.talent_id ? styles.nameFocused : ''}`}
                                                                        >
                                                                            <span
                                                                                className={styles.lastName}
                                                                                onClick={() => setFocusedTalentId(
                                                                                    focusedTalentId === a.talent_id ? null : a.talent_id
                                                                                )}
                                                                            >
                                                                                {getLastName(a)}
                                                                            </span>
                                                                            <button
                                                                                className={styles.removeBtn}
                                                                                onClick={() => handleRemove(a)}
                                                                            >×</button>
                                                                        </div>
                                                                    ))}
                                                                    <button
                                                                        className={styles.addBtn}
                                                                        onClick={() => openSlotModal(shift.id, day.iso)}
                                                                    >+ Add</button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}

                                                {cellRoles.length === 0 && (
                                                    <button
                                                        className={styles.addBtn}
                                                        onClick={() => openSlotModal(shift.id, day.iso)}
                                                    >
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                                            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                                                        </svg>
                                                        Add
                                                    </button>
                                                )}

                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ── Talent week panel ───────────────────────────────────────── */}
            {focusedTalent && (
                <div className={styles.talentPanel}>
                    <div className={styles.talentPanelHeader}>
                        <div>
                            <div className={styles.talentPanelName}>
                                {focusedTalent.firstname} {focusedTalent.lastname}
                            </div>
                            <div className={styles.talentPanelRole}>{focusedTalent.tal_role}</div>
                        </div>
                        <button className={styles.talentPanelClose} onClick={() => setFocusedTalentId(null)}>×</button>
                    </div>
                    <div className={styles.talentPanelBody}>
                        {focusedAssignments.length === 0 ? (
                            <p className={styles.talentPanelEmpty}>Not scheduled this week.</p>
                        ) : (
                            <div className={styles.talentShifts}>
                                {focusedAssignments.map((a, i) => {
                                    const sn = (a.shift_name || '').toLowerCase();
                                    const [yr, mo, dy] = a.date_of.split('-').map(Number);
                                    const dayLabel = new Date(yr, mo - 1, dy)
                                        .toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
                                    return (
                                        <div key={i} className={styles.talentShift}>
                                            <span className={styles.talentShiftDay}>{dayLabel}</span>
                                            <span className={`${styles.talentShiftPeriod} ${styles[sn] || ''}`}>
                                                {sn.toUpperCase()}
                                            </span>
                                            <span className={styles.talentShiftTime}>
                                                {(a.start_time || '').substring(0, 5)}–{(a.end_time || '').substring(0, 5)}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {slotModal && (
                <SlotAssignModal
                    isOpen={!!slotModal}
                    onClose={() => setSlotModal(null)}
                    onAssign={handleAssign}
                    shiftId={slotModal.shiftId}
                    dateOf={slotModal.dateOf}
                    scheduleId={isDraft ? null : schedule?.id}
                    alreadyAssigned={slotModal.existingIds}
                />
            )}
        </div>
    );
}
