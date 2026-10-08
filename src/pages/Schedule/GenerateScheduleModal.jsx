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

    const getNextMonday = () => {
        const d = new Date();
        d.setDate(d.getDate() + (1 + 7 - d.getDay()) % 7 || 7);
        return d.toISOString().split('T')[0];
    };

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
                        {isSubmitting ? 'Starting…' : 'Generate Schedule'}
                    </button>
                </>
            }
        >
            <form className={styles.form}>
                <p className={styles.hint}>
                    Select the starting Monday for the new week. The schedule will generate in the
                    background — you can keep using the app while it runs.
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
