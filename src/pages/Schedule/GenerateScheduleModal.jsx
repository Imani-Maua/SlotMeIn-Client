import { useState } from 'react';
import { generateSchedule } from '../../api/scheduleService';
import { useToast } from '../../components/Toast/Toast';
import Modal from '../../components/Modal/Modal';
import { formatError } from '../../utils/errorUtils';
import styles from './PeriodModal.module.scss';

export default function GenerateScheduleModal({ isOpen, onClose, onJobStarted }) {
    const toast = useToast();
    const [startDate,    setStartDate]    = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!startDate) return;
        setIsSubmitting(true);
        try {
            const { job_id } = await generateSchedule(startDate);
            onJobStarted(job_id);
            onClose();
        } catch (error) {
            toast({ message: formatError(error), type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Generate Weekly Schedule"
            footer={
                <>
                    <button className={styles.cancelBtn} onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </button>
                    <button
                        className={styles.submitBtn}
                        onClick={handleSubmit}
                        disabled={!startDate || isSubmitting}
                    >
                        {isSubmitting ? 'Starting…' : 'Generate'}
                    </button>
                </>
            }
        >
            <form className={styles.form}>
                <p className={styles.hint}>
                    The engine will use your saved settings. To adjust occupancy defaults or
                    data sources, visit <strong>Settings</strong> in the sidebar.
                </p>
                <div className={styles.formGroup}>
                    <label>Week Starting (Monday)</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        required
                    />
                </div>
            </form>
        </Modal>
    );
}
