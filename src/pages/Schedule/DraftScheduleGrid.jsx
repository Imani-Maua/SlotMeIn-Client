import { useState, useMemo, useRef } from 'react';
import { createAssignment, deleteAssignment } from '../../api/scheduleService';
import { useToast } from '../../components/Toast/Toast';
import SlotAssignModal from './SlotAssignModal';
import { formatError } from '../../utils/errorUtils';
import styles from './DraftScheduleGrid.module.scss';

let _tempIdCounter = 0;
const nextTempId = () => `temp-${++_tempIdCounter}`;

const SHIFT_PERIODS = [
    { id: 'am', label: 'Morning (AM)', start: '06:00', end: '16:00' },
    { id: 'lounge', label: 'Lounge', start: '11:00', end: '23:59' },
    { id: 'pm', label: 'Evening (PM)', start: '15:00', end: '23:59' },
];

const ROLE_PALETTE = [
    '#1b2a5e', '#7c3aed', '#0891b2', '#059669', '#b45309',
    '#be185d', '#dc2626', '#9f1239', '#064e3b', '#713f12',
];

function buildRoleColorMap(talents) {
    const roles = [...new Set(talents.map(talent => talent.tal_role).filter(Boolean))].sort();
    const map = {};
    roles.forEach((role, i) => { map[role] = ROLE_PALETTE[i % ROLE_PALETTE.length]; });
    return map;
}

function getWeekDays(weekStart) {
    if (!weekStart) return [];
    // Parse YYYY-MM-DD directly to avoid UTC midnight timezone issues
    const [year, month, day] = weekStart.split('-').map(Number);
    const days = [];
    for (let i = 0; i < 7; i++) {
        const d= new Date(year, month - 1, day + i);
        days.push({
            iso: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
            label: d.toLocaleDateString('en-GB', { weekday: 'short' }),
            date: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        });
    }
    return days;
}

export default function DraftScheduleGrid({ schedule, isDraft, talents, onUpdateDraft, onRefresh }) {
    const toast = useToast();
    const [slotModal, setSlotModal] = useState(null);
    const [localAssignments, setLocalAssignments] = useState(schedule?.assignments || []);

    const weekDays = useMemo(() => getWeekDays(schedule?.week_start), [schedule?.week_start]);
    const roleColors = useMemo(() => buildRoleColorMap(talents), [talents]);
    const uniqueRoles = useMemo(() => Object.keys(roleColors), [roleColors]);

    const cellMap = useMemo(() => {
        const map = {};
        localAssignments.forEach(a => {
            const sn = (a.shift_name || '').toLowerCase();
            const key = `${a.date_of}|${sn}`;
            if (!map[key]) map[key] = [];
            map[key].push(a);
        });
        return map;
    }, [localAssignments]);

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
                    talent_id: assignment.talent_id,
                    date_of: assignment.date_of,
                    start_time: assignment.start_time + ':00',
                    end_time: endTime,
                    shift_name: assignment.shift_name,
                    schedule_id: schedule.id,
                });
                toast({ message: 'Assignment added.', type: 'success' });
                const next = [...localAssignments, {
                    ...created,
                    talent_name: assignment.talent_name,
                    tal_role: assignment.tal_role,
                }];
                setLocalAssignments(next);
                onRefresh?.();
            } catch (e) {
                toast({ message: formatError(e), type: 'error' });
            }
        }
    }

    async function handleRemove(assignment) {
        if (!window.confirm(`Remove ${assignment.talent_name || 'this person'} from this slot?`)) return;
        if (isDraft || String(assignment.id).startsWith('temp-')) {
            const next = localAssignments.filter(a => a.id !== assignment.id);
            setLocalAssignments(next);
            onUpdateDraft?.({ ...schedule, assignments: next });
        } else {
            try {
                await deleteAssignment(assignment.id);
                toast({ message: 'Removed.', type: 'success' });
                const next = localAssignments.filter(a => a.id !== assignment.id);
                setLocalAssignments(next);
                onRefresh?.();
            } catch (e) {
                toast({ message: formatError(e), type: 'error' });
            }
        }
    }

    function resolveName(a) {
        if (a.talent_name) return a.talent_name;
        const t = talents.find(t => t.id === a.talent_id);
        return t ? `${t.firstname} ${t.lastname}` : `#${a.talent_id}`;
    }

    function resolveRole(a) {
        if (a.tal_role) return a.tal_role;
        return talents.find(t => t.id === a.talent_id)?.tal_role || null;
    }

    return (
        <div className={styles.wrapper}>
            <div className={styles.legend}>
                <span className={styles.legendLabel}>Roles:</span>
                {uniqueRoles.map(r => (
                    <div key={r} className={styles.legendItem}>
                        <span className={styles.dot} style={{ background: roleColors[r] }} />
                        <span>{r}</span>
                    </div>
                ))}
            </div>

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
                                    const key = `${day.iso}|${shift.id}`;
                                    const cells = cellMap[key] || [];
                                    return (
                                        <td key={day.iso} className={styles.cell}>
                                            <div className={styles.cellContent}>
                                                {cells.map(a => {
                                                    const role = resolveRole(a);
                                                    const color = roleColors[role] || '#6b7280';
                                                    return (
                                                        <div key={a.id} className={styles.assignedRow}>
                                                            <span className={styles.roleDot} style={{ background: color }} />
                                                            <span className={styles.assignName}>{resolveName(a)}</span>
                                                            <button className={styles.removeBtn} onClick={() => handleRemove(a)}>×</button>
                                                        </div>
                                                    );
                                                })}
                                                <button className={styles.addBtn} onClick={() => openSlotModal(shift.id, day.iso)}>
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                                                    </svg>
                                                    Add
                                                </button>
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

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
