import { useState, useEffect } from 'react';
import Modal from '../../components/Modal/Modal';
import { updateShiftPeriod } from '../../api/shiftService';
import { useToast } from '../../components/Toast/Toast';
import { formatError } from '../../utils/errorUtils';
import styles from './PeriodModal.module.scss';

export default function EditPeriodModal({ period, isOpen, onClose, onSuccess }) {
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ start_time: '', end_time: '' });

    useEffect(() => {
        if (period && isOpen) {
            setForm({
                start_time: period.start_time || '',
                end_time: period.end_time || '',
            });
        }
    }, [period, isOpen]);

    async function handleSubmit(e) {
        e.preventDefault();
        if (!period) return;
        setLoading(true);
        try {
            const updatedPeriod = await updateShiftPeriod(period.id, form);
            toast({ message: 'Shift period updated.', type: 'success' });
            onSuccess(updatedPeriod);
            onClose();
        } catch (error) {
            toast({ message: formatError(error), type: 'error' });
        } finally {
            setLoading(false);
        }
    }

    const periodLabel = period?.shift_name ? period.shift_name.toUpperCase() : '';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Edit Period — ${periodLabel}`} size="sm">
            <form onSubmit={handleSubmit} className={styles.form}>
                <p className={styles.hint}>
                    Adjust the overall time window for this shift period.
                    Templates inside must fall within these bounds.
                </p>

                <div className={styles.row}>
                    <div className={styles.field}>
                        <label htmlFor="edit_start_time">Start Time</label>
                        <input
                            id="edit_start_time"
                            type="time"
                            required
                            value={form.start_time}
                            onChange={e => setForm(prev => ({ ...prev, start_time: e.target.value }))}
                        />
                    </div>
                    <div className={styles.field}>
                        <label htmlFor="edit_end_time">End Time</label>
                        <input
                            id="edit_end_time"
                            type="time"
                            required
                            value={form.end_time}
                            onChange={e => setForm(prev => ({ ...prev, end_time: e.target.value }))}
                        />
                    </div>
                </div>

                <div className={styles.actions}>
                    <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={loading}>Cancel</button>
                    <button type="submit" className={styles.submitBtn} disabled={loading}>
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
