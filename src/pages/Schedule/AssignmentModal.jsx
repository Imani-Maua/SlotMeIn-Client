import { useState, useEffect } from 'react';
import { updateAssignment, createAssignment, deleteAssignment } from '../../api/scheduleService';
import { getTalents } from '../../api/talentService';
import { useToast } from '../../components/Toast/Toast';
import Modal from '../../components/Modal/Modal';
import { formatError } from '../../utils/errorUtils';
import styles from './PeriodModal.module.scss';

export default function AssignmentModal({
    assignment,
    dateOf,
    scheduleId,
    talentId,       // pre-selected from cell click
    isOpen,
    onClose,
    onSuccess,
}) {
    const toast = useToast();
    const [talents, setTalents] = useState([]);
    const [formData, setFormData] = useState({
        talent_id: '',
        shift_name: '',
        start_time: '08:00',
        end_time: '16:00',
    });
    const [loading, setLoading] = useState(false);

    const SHIFT_TYPES = [
        { id: 'am', label: 'Morning (AM)', start: '06:00', end: '16:00' },
        { id: 'lounge', label: 'Lounge', start: '11:00', end: '23:59' },
        { id: 'pm', label: 'Evening (PM)', start: '15:00', end: '23:59' },
    ];

    useEffect(() => {
        if (isOpen) {
            fetchTalents();
            if (assignment) {
                setFormData({
                    talent_id: assignment.talent_id || talentId || '',
                    shift_name: assignment.shift_name || '',
                    start_time: assignment.start_time.substring(0, 5),
                    end_time: assignment.end_time.substring(0, 5),
                });
            } else {
                setFormData({
                    talent_id: talentId || '',   // ← pre-filled from cell
                    shift_name: '',
                    start_time: '08:00',
                    end_time: '16:00',
                });
            }
        }
    }, [isOpen, assignment, talentId]);

    const handleTypeChange = (typeName) => {
        const type = SHIFT_TYPES.find(t => t.id === typeName);
        if (type) {
            setFormData({ ...formData, shift_name: type.id, start_time: type.start, end_time: type.end });
        } else {
            setFormData({ ...formData, shift_name: typeName });
        }
    };

    async function fetchTalents() {
        try {
            const data = await getTalents();
            setTalents(data.filter(t => t.is_active));
        } catch (error) {
            console.error(error);
        }
    }

    // Resolve the talent name for context display
    const selectedTalent = talents.find(t => String(t.id) === String(formData.talent_id));
    const talentLabel = selectedTalent
        ? `${selectedTalent.firstname} ${selectedTalent.lastname} · ${selectedTalent.tal_role}`
        : null;

    // Format the date nicely for the header context
    const dateLabel = dateOf
        ? new Date(dateOf).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
        : null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = { ...formData, date_of: dateOf };

        if (!scheduleId || scheduleId === 'draft') {
            onSuccess(payload);
            return;
        }

        setLoading(true);
        try {
            let result;
            if (assignment) {
                result = await updateAssignment(assignment.id, payload);
                toast({ message: 'Assignment updated.', type: 'success' });
            } else {
                result = await createAssignment({ ...payload, schedule_id: scheduleId });
                toast({ message: 'Assignment created.', type: 'success' });
            }
            onSuccess(result);
        } catch (error) {
            toast({ message: formatError(error), type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Remove this assignment?')) return;

        if (!scheduleId || scheduleId === 'draft') {
            onSuccess(null, true);
            return;
        }

        setLoading(true);
        try {
            await deleteAssignment(assignment.id);
            toast({ message: 'Assignment removed.', type: 'success' });
            onSuccess(null, true);
        } catch (error) {
            toast({ message: formatError(error), type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={assignment ? 'Edit Assignment' : 'Add Assignment'}
            footer={
                <>
                    {assignment && (
                        <button
                            className={styles.deleteBtn}
                            onClick={handleDelete}
                            disabled={loading}
                            style={{ marginRight: 'auto' }}
                        >
                            Delete
                        </button>
                    )}
                    <button className={styles.cancelBtn} onClick={onClose} disabled={loading}>
                        Cancel
                    </button>
                    <button className={styles.submitBtn} onClick={handleSubmit} disabled={loading}>
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </>
            }
        >
            <form className={styles.form} onSubmit={handleSubmit}>

                {/* ── Context banner — who & when ─────────────────────── */}
                {(talentLabel || dateLabel) && (
                    <div className={styles.contextBanner}>
                        {talentLabel && (
                            <div className={styles.contextItem}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                                </svg>
                                <span>{talentLabel}</span>
                            </div>
                        )}
                        {dateLabel && (
                            <div className={styles.contextItem}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                                <span>{dateLabel}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Shift type ─────────────────────────────────────── */}
                <div className={styles.formGroup}>
                    <label>Shift Type</label>
                    <select
                        value={formData.shift_name}
                        onChange={e => handleTypeChange(e.target.value)}
                        required
                    >
                        <option value="">Select Type</option>
                        {SHIFT_TYPES.map(t => (
                            <option key={t.id} value={t.id}>{t.label}</option>
                        ))}
                    </select>
                </div>

                {/* ── Staff member — only show dropdown if no context ── */}
                {!talentId && (
                    <div className={styles.formGroup}>
                        <label>Staff Member</label>
                        <select
                            value={formData.talent_id}
                            onChange={e => setFormData({ ...formData, talent_id: e.target.value })}
                            required
                        >
                            <option value="">Select Talent</option>
                            {talents.map(t => (
                                <option key={t.id} value={t.id}>
                                    {t.firstname} {t.lastname} ({t.tal_role})
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* ── Times ─────────────────────────────────────────── */}
                <div className={styles.row}>
                    <div className={styles.formGroup}>
                        <label>Start Time</label>
                        <input
                            type="time"
                            value={formData.start_time}
                            onChange={e => setFormData({ ...formData, start_time: e.target.value })}
                            required
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>End Time</label>
                        <input
                            type="time"
                            value={formData.end_time}
                            onChange={e => setFormData({ ...formData, end_time: e.target.value })}
                            required
                        />
                    </div>
                </div>

                <p className={styles.hint}>
                    Manual overrides bypass all staffing and availability constraints.
                    Be careful not to exceed legal working hours.
                </p>
            </form>
        </Modal>
    );
}
