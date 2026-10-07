import { useState } from 'react';
import { generateSchedule, getJobResult } from '../../api/scheduleService';
import { useToast } from '../../components/Toast/Toast';
import Modal from '../../components/Modal/Modal';
import { formatError } from '../../utils/errorUtils';
import styles from './PeriodModal.module.scss'; // Reusing standard modal styles

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 90000;

export default function GenerateScheduleModal({ isOpen, onClose, onSuccess }) {
    const toast = useToast();
    const [startDate, setStartDate] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    // Find next Monday
    const getNextMonday = () => {
        const d = new Date();
        d.setDate(d.getDate() + (1 + 7 - d.getDay()) % 7 || 7);
        return d.toISOString().split('T')[0];
    };

    const pollForResult = (jobId) => new Promise((resolve, reject) => {
        const deadline = Date.now() + POLL_TIMEOUT_MS;

        const check = async () => {
            if (Date.now() > deadline) {
                return reject(new Error('Schedule generation timed out. Please try again.'));
            }
            try {
                const data = await getJobResult(jobId);
                if (data.status === 'done') return resolve(data.result);
                if (data.status === 'failed') return reject(new Error(data.error || 'Solver failed.'));
                setTimeout(check, POLL_INTERVAL_MS);
            } catch (err) {
                reject(err);
            }
        };

        setTimeout(check, POLL_INTERVAL_MS);
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!startDate) return;

        setIsGenerating(true);
        try {
            const { job_id } = await generateSchedule(startDate);
            const result = await pollForResult(job_id);
            toast({ message: 'Schedule generated successfully!', type: 'success' });
            onSuccess(result);
        } catch (error) {
            toast({ message: formatError(error), type: 'error' });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Generate Weekly Schedule"
            footer={
                <>
                    <button className={styles.cancelBtn} onClick={onClose} disabled={isGenerating}>
                        Cancel
                    </button>
                    <button
                        className={styles.submitBtn}
                        onClick={handleSubmit}
                        disabled={!startDate || isGenerating}
                    >
                        {isGenerating ? 'Generating...' : 'Generate Schedule'}
                    </button>
                </>
            }
        >
            <form className={styles.form}>
                <p className={styles.hint}>
                    Select the starting Monday for the new week. The system will automatically allocate
                    talents based on your shift templates and availability rules.
                </p>
                <div className={styles.formGroup}>
                    <label>Week Starting (Monday)</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        required
                        min={getNextMonday()}
                    />
                </div>
                {isGenerating && (
                    <div className={styles.loadingOverlay}>
                        <div className={styles.spinner} />
                        <p>Running optimization algorithm...</p>
                    </div>
                )}
            </form>
        </Modal>
    );
}
