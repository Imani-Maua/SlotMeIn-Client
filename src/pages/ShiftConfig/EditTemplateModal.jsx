import { useState, useEffect } from 'react';
import Modal from '../../components/Modal/Modal';
import { updateShiftTemplate } from '../../api/shiftService';
import { useToast } from '../../components/Toast/Toast';
import styles from './PeriodModal.module.scss';
import { formatError } from '../../utils/errorUtils';

const ROLES = ['manager', 'leader', 'bartender', 'server', 'runner', 'hostess'];

export default function EditTemplateModal({ template, period, isOpen, onClose, onSuccess }) {
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ role: '', shift_start: '', shift_end: '' });

    useEffect(() => {
        if (template && isOpen) {
            setForm({
                role: template.role || '',
                shift_start: template.shift_start || '',
                shift_end: template.shift_end || '',
            });
        }
    }, [template, isOpen]);

    function resetAndClose() {
        onClose();
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!template) return;
        setLoading(true);
        try {
            const updatedTemplate = await updateShiftTemplate(template.id, form);
            toast({ message: 'Template updated.', type: 'success' });
            onSuccess(updatedTemplate);
            resetAndClose();
        } catch (error) {
            toast({ message: formatError(error), type: 'error' });
        } finally {
            setLoading(false);
        }
    }

    const periodLabel = period?.shift_name ? period.shift_name.toUpperCase() : '';

    return (
        <Modal isOpen={isOpen} onClose={resetAndClose} title={`Edit Template — ${periodLabel}`} size="sm">
            <form onSubmit={handleSubmit} className={styles.form}>
                {period && (
                    <p className={styles.hint}>
                        Times must fall within <strong>{period.start_time} → {period.end_time}</strong>.
                        Minimum shift length is 4 hours.
                    </p>
                )}

                <div className={styles.field}>
                    <label htmlFor="edit_template_role">Role</label>
                    <select
                        id="edit_template_role"
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
                        <label htmlFor="edit_shift_start">Shift Start</label>
                        <input
                            id="edit_shift_start"
                            type="time"
                            required
                            value={form.shift_start}
                            onChange={e => setForm(prev => ({ ...prev, shift_start: e.target.value }))}
                        />
                    </div>
                    <div className={styles.field}>
                        <label htmlFor="edit_shift_end">Shift End</label>
                        <input
                            id="edit_shift_end"
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
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
