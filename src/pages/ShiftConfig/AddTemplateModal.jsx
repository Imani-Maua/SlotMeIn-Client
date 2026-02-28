import { useState } from 'react';
import Modal from '../../components/Modal/Modal';
import { createShiftTemplate } from '../../api/shiftService';
import { useToast } from '../../components/Toast/Toast';
import styles from './PeriodModal.module.scss';
import { formatError } from '../../utils/errorUtils';

const PERIOD_LABELS = { am: 'Morning Shift', pm: 'Evening Shift', lounge: 'Lounge' };
const ROLES = ['manager', 'leader', 'bartender', 'server', 'runner', 'hostess'];

export default function AddTemplateModal({ period, isOpen, onClose, onSuccess }) {
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ role: '', shift_start: '', shift_end: '' });

    function resetAndClose() {
        setForm({ role: '', shift_start: '', shift_end: '' });
        onClose();
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!period) return;
        setLoading(true);
        try {
            const newTemplate = await createShiftTemplate({
                period_id: period.id,
                role: form.role,
                shift_start: form.shift_start,
                shift_end: form.shift_end,
            });
            toast({ message: 'Template added.', type: 'success' });
            onSuccess(newTemplate);
            resetAndClose();
        } catch (error) {
            toast({ message: formatError(error), type: 'error' });
        } finally {
            setLoading(false);
        }
    }

    const periodLabel = period?.shift_name ? period.shift_name.toUpperCase() : '';

    return (
        <Modal isOpen={isOpen} onClose={resetAndClose} title={`Add Template — ${periodLabel}`} size="sm">
            <form onSubmit={handleSubmit} className={styles.form}>
                {period && (
                    <p className={styles.hint}>
                        Times must fall within the <strong>{PERIOD_LABELS[period.shift_name] || period.shift_name}</strong> window: <strong>{period.start_time} → {period.end_time}</strong>.
                        Minimum shift length is 4 hours.
                    </p>
                )}

                <div className={styles.field}>
                    <label htmlFor="template_role">Role</label>
                    <select
                        id="template_role"
                        value={form.role}
                        onChange={e => setForm(prev => ({ ...prev, role: e.target.value }))}
                        required
                    >
                        <option value="">Select a role...</option>
                        {ROLES.map(r => (
                            <option key={r} value={r}>{r}</option>
                        ))}
                    </select>
                </div>

                <div className={styles.row}>
                    <div className={styles.field}>
                        <label htmlFor="shift_start">Shift Start</label>
                        <input
                            id="shift_start"
                            type="time"
                            required
                            value={form.shift_start}
                            onChange={e => setForm(prev => ({ ...prev, shift_start: e.target.value }))}
                        />
                    </div>
                    <div className={styles.field}>
                        <label htmlFor="shift_end">Shift End</label>
                        <input
                            id="shift_end"
                            type="time"
                            required
                            value={form.shift_end}
                            onChange={e => setForm(prev => ({ ...prev, shift_end: e.target.value }))}
                        />
                    </div>
                </div>

                <div className={styles.actions}>
                    <button type="button" className={styles.cancelBtn} onClick={resetAndClose} disabled={loading}>Cancel</button>
                    <button type="submit" className={styles.submitBtn} disabled={loading || !form.role}>
                        {loading ? 'Adding...' : 'Add Template'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
