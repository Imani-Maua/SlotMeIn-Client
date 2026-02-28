import { useState } from 'react';
import Modal from '../../components/Modal/Modal';
import { createShiftPeriod } from '../../api/shiftService';
import { useToast } from '../../components/Toast/Toast';
import { formatError } from '../../utils/errorUtils';
import styles from './PeriodModal.module.scss';

const ALL_PERIODS = ['am', 'pm', 'lounge'];

// These are fixed by the backend — not configurable
const PERIOD_TIMES = {
    am: { start_time: '06:00', end_time: '16:00' },
    pm: { start_time: '15:00', end_time: '23:59' },
    lounge: { start_time: '11:00', end_time: '23:59' },
};

export default function AddPeriodModal({ isOpen, onClose, existingPeriodNames, onSuccess }) {
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [shiftName, setShiftName] = useState('');

    const availablePeriods = ALL_PERIODS.filter(p => !existingPeriodNames.includes(p));
    const preview = PERIOD_TIMES[shiftName];

    function resetAndClose() {
        setShiftName('');
        onClose();
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!shiftName) return;
        setLoading(true);
        try {
            const newPeriod = await createShiftPeriod({
                shift_name: shiftName,
                ...PERIOD_TIMES[shiftName],
            });
            toast({ message: 'Shift period created.', type: 'success' });
            onSuccess(newPeriod);
            resetAndClose();
        } catch (error) {
            toast({ message: formatError(error), type: 'error' });
        } finally {
            setLoading(false);
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={resetAndClose} title="Add Shift Period" size="sm">
            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.field}>
                    <label htmlFor="shift_name">Period Type</label>
                    <select
                        id="shift_name"
                        value={shiftName}
                        onChange={e => setShiftName(e.target.value)}
                        required
                    >
                        <option value="">Select a period...</option>
                        {availablePeriods.map(p => (
                            <option key={p} value={p}>{p.toUpperCase()}</option>
                        ))}
                    </select>
                </div>

                {preview && (
                    <div className={styles.timesPreview}>
                        <span className={styles.timesLabel}>Fixed hours</span>
                        <span className={styles.timesValue}>
                            {preview.start_time} → {preview.end_time}
                        </span>
                        <p className={styles.timesNote}>
                            Shift periods have fixed times set by your scheduling configuration.
                        </p>
                    </div>
                )}

                <div className={styles.actions}>
                    <button type="button" className={styles.cancelBtn} onClick={resetAndClose} disabled={loading}>Cancel</button>
                    <button type="submit" className={styles.submitBtn} disabled={loading || !shiftName}>
                        {loading ? 'Creating...' : 'Create Period'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
