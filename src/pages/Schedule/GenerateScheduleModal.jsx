import { useState } from 'react';
import { generateSchedule } from '../../api/scheduleService';
import { useToast } from '../../components/Toast/Toast';
import Modal from '../../components/Modal/Modal';
import { formatError } from '../../utils/errorUtils';
import styles from './PeriodModal.module.scss'; // Reusing standard modal styles

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!startDate) return;

        setIsGenerating(true);
        try {
            const result = await generateSchedule(startDate);
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
