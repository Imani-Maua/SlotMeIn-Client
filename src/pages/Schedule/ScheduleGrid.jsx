import { useState, useEffect } from 'react';
import { getTalents } from '../../api/talentService';
import Spinner from '../../components/Spinner/Spinner';
import AssignmentModal from './AssignmentModal';
import styles from './ScheduleGrid.module.scss';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function ScheduleGrid({ schedule, isDraft, onRefresh, onUpdateDraft }) {
    const [talents, setTalents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
    const [roleFilter, setRoleFilter] = useState('all');

    useEffect(() => {
        fetchTalents();
    }, []);

    async function fetchTalents() {
        try {
            const data = await getTalents();
            setTalents(data.filter(t => t.is_active));
        } catch (error) {
            console.error('Failed to fetch talents', error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) return <div className={styles.center}><Spinner /></div>;

    // Derive unique roles from active talents for the filter
    const roles = ['all', ...Array.from(new Set(talents.map(t => t.tal_role).filter(Boolean))).sort()];

    // Apply role filter
    const visibleTalents = roleFilter === 'all'
        ? talents
        : talents.filter(t => t.tal_role === roleFilter);

    // Get dates for the header
    const weekDates = [];
    const startDate = new Date(schedule.week_start);
    for (let i = 0; i < 7; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        weekDates.push(d);
    }

    // Map assignments: { [talent_id]: { [date_string]: assignment } }
    const assignmentMap = {};
    schedule.assignments.forEach(a => {
        if (!assignmentMap[a.talent_id]) assignmentMap[a.talent_id] = {};
        assignmentMap[a.talent_id][a.date_of] = a;
    });

    const handleCellClick = (talentId, dateStr, assignment = null) => {
        setSelectedAssignment({ assignment, dateStr, talentId });
        setIsAssignmentModalOpen(true);
    };

    return (
        <div className={styles.container}>
            {/* ── Role Filter Bar ────────────────────────────────────────── */}
            <div className={styles.filterBar}>
                <span className={styles.filterLabel}>Filter by role:</span>
                <div className={styles.filterPills}>
                    {roles.map(role => (
                        <button
                            key={role}
                            className={`${styles.pill} ${roleFilter === role ? styles.pillActive : ''}`}
                            onClick={() => setRoleFilter(role)}
                        >
                            {role === 'all' ? 'All Roles' : role.charAt(0).toUpperCase() + role.slice(1)}
                        </button>
                    ))}
                </div>
                {roleFilter !== 'all' && (
                    <span className={styles.filterCount}>
                        {visibleTalents.length} staff member{visibleTalents.length !== 1 ? 's' : ''}
                    </span>
                )}
            </div>

            {/* ── Grid ──────────────────────────────────────────────────── */}
            <div className={styles.grid}>
                {/* Header */}
                <div key="header-staff" className={styles.talentHeaderCell}>Staff Member</div>
                {weekDates.map((date, i) => (
                    <div key={`header-date-${i}`} className={styles.headerCell}>
                        <span className={styles.dayName}>{DAYS[i]}</span>
                        <span className={styles.date}>
                            {date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </span>
                    </div>
                ))}

                {/* Rows for each visible talent */}
                {visibleTalents.map(talent => (
                    <div key={talent.id} className={styles.row}>
                        <div className={styles.talentCell}>
                            <span className={styles.name}>{talent.firstname} {talent.lastname}</span>
                            <span className={styles.role}>{talent.tal_role}</span>
                        </div>

                        {weekDates.map((date, i) => {
                            const dateStr = date.toISOString().split('T')[0];
                            const assignment = assignmentMap[talent.id]?.[dateStr];

                            const getShiftClass = (shiftName) => {
                                if (!shiftName) return styles.custom;
                                const name = shiftName.toLowerCase();
                                if (name === 'am') return styles.am;
                                if (name === 'lounge') return styles.lounge;
                                if (name === 'pm') return styles.pm;
                                return styles.custom;
                            };

                            return (
                                <div
                                    key={`cell-${talent.id}-${i}`}
                                    className={styles.cell}
                                    onClick={() => handleCellClick(talent.id, dateStr, assignment)}
                                >
                                    {assignment ? (
                                        <div className={`${styles.shiftCard} ${getShiftClass(assignment.shift_name)}`}>
                                            <div className={styles.time}>
                                                {assignment.start_time.substring(0, 5)} - {assignment.end_time.substring(0, 5)}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className={styles.emptyCell}>
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}

                {visibleTalents.length === 0 && (
                    <div className={styles.noResults} style={{ gridColumn: `1 / ${weekDates.length + 2}` }}>
                        No staff members match the selected role.
                    </div>
                )}
            </div>

            <AssignmentModal
                assignment={selectedAssignment?.assignment}
                dateOf={selectedAssignment?.dateStr}
                talentId={selectedAssignment?.talentId}
                scheduleId={schedule.id}
                isOpen={isAssignmentModalOpen}
                onClose={() => setIsAssignmentModalOpen(false)}
                onSuccess={(newAssignment, isDeletion) => {
                    setIsAssignmentModalOpen(false);
                    if (isDraft) {
                        let newAssignments;
                        if (isDeletion) {
                            newAssignments = schedule.assignments.filter(a => a !== selectedAssignment.assignment);
                        } else {
                            const existingIdx = schedule.assignments.findIndex(a => a === selectedAssignment.assignment);
                            if (existingIdx >= 0) {
                                newAssignments = [...schedule.assignments];
                                newAssignments[existingIdx] = newAssignment;
                            } else {
                                newAssignments = [...schedule.assignments, newAssignment];
                            }
                        }
                        onUpdateDraft({ ...schedule, assignments: newAssignments });
                    } else {
                        onRefresh();
                    }
                }}
            />
        </div>
    );
}
