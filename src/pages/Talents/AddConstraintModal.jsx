import { useState } from 'react';
import Modal from '../../components/Modal/Modal';
import { createConstraint, deleteConstraint, createRule } from '../../api/constraintService';
import { useToast } from '../../components/Toast/Toast';
import styles from './AddConstraintModal.module.scss';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const SHIFTS = ['am', 'pm', 'lounge'];

const CONSTRAINT_TYPES = [
    {
        value: 'availability',
        label: 'Working Days',
        description: 'Select the days this person is available to work.',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
        ),
    },
    {
        value: 'shift restriction',
        label: 'Allowed Shifts',
        description: 'Select the shift types this person can be assigned.',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
        ),
    },
    {
        value: 'combination',
        label: 'Specific Schedule',
        description: 'Select the exact day + shift combination this person works.',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
        ),
    },
];

export default function AddConstraintModal({ talent, existingConstraintTypes, isOpen, onClose, onSuccess }) {
    const toast = useToast();
    const [step, setStep] = useState(1);
    const [selectedType, setSelectedType] = useState(null);
    const [selectedDays, setSelectedDays] = useState([]);
    const [selectedShifts, setSelectedShifts] = useState([]);
    const [loading, setLoading] = useState(false);

    function reset() {
        setStep(1);
        setSelectedType(null);
        setSelectedDays([]);
        setSelectedShifts([]);
    }

    function handleClose() {
        reset();
        onClose();
    }

    function toggleItem(list, setList, value) {
        setList(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
    }

    async function handleSubmit() {
        setLoading(true);
        let createdConstraint = null;
        try {
            // Step 1: create the constraint record
            createdConstraint = await createConstraint({ talent_id: talent.id, type: selectedType });

            // Step 2: create the rules
            const rulePayload = {
                constraint_id: createdConstraint.id,
                ...(selectedDays.length > 0 && { day: selectedDays }),
                ...(selectedShifts.length > 0 && { shifts: selectedShifts }),
            };
            await createRule(rulePayload);

            toast({ message: 'Constraint added successfully.', type: 'success' });
            onSuccess();
            handleClose();
        } catch (error) {
            // Mini rollback: if rule creation failed but constraint was created, delete it
            if (createdConstraint?.id) {
                try { await deleteConstraint(createdConstraint.id); } catch (_) { }
            }
            toast({ message: error.response?.data?.detail || 'Failed to add constraint.', type: 'error' });
        } finally {
            setLoading(false);
        }
    }

    const canSubmit = () => {
        if (!selectedType) return false;
        if (selectedType === 'availability') return selectedDays.length > 0;
        if (selectedType === 'shift restriction') return selectedShifts.length > 0;
        if (selectedType === 'combination') return selectedDays.length > 0 && selectedShifts.length > 0;
        return false;
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Add Constraint" size="md">
            <div className={styles.container}>

                {/* ── Step 1: Choose type ─────────────────────── */}
                {step === 1 && (
                    <div className={styles.stepContent}>
                        <p className={styles.stepHint}>Choose the type of constraint for <strong>{talent?.firstname}</strong>:</p>
                        <div className={styles.typeCards}>
                            {CONSTRAINT_TYPES.map(type => {
                                const alreadyExists = existingConstraintTypes?.includes(type.value);
                                return (
                                    <button
                                        key={type.value}
                                        className={`${styles.typeCard} ${selectedType === type.value ? styles.selected : ''} ${alreadyExists ? styles.disabled : ''}`}
                                        onClick={() => !alreadyExists && setSelectedType(type.value)}
                                        disabled={alreadyExists}
                                        title={alreadyExists ? 'This constraint type already exists' : ''}
                                    >
                                        <div className={styles.typeIcon}>{type.icon}</div>
                                        <div className={styles.typeText}>
                                            <span className={styles.typeLabel}>{type.label}</span>
                                            <span className={styles.typeDesc}>{type.description}</span>
                                        </div>
                                        {alreadyExists && <span className={styles.existsBadge}>Set</span>}
                                    </button>
                                );
                            })}
                        </div>
                        <div className={styles.actions}>
                            <button className={styles.cancelBtn} onClick={handleClose}>Cancel</button>
                            <button
                                className={styles.nextBtn}
                                disabled={!selectedType}
                                onClick={() => setStep(2)}
                            >
                                Next →
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Step 2: Pick days / shifts ──────────────── */}
                {step === 2 && (
                    <div className={styles.stepContent}>
                        <button className={styles.backBtn} onClick={() => setStep(1)}>← Back</button>

                        {/* Days picker — shown for availability & combination */}
                        {(selectedType === 'availability' || selectedType === 'combination') && (
                            <div className={styles.pickerGroup}>
                                <label className={styles.pickerLabel}>Select Days</label>
                                <div className={styles.pills}>
                                    {DAYS.map(day => (
                                        <button
                                            key={day}
                                            className={`${styles.pill} ${selectedDays.includes(day) ? styles.pillActive : ''}`}
                                            onClick={() => toggleItem(selectedDays, setSelectedDays, day)}
                                        >
                                            {day}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Shifts picker — shown for shift restriction & combination */}
                        {(selectedType === 'shift restriction' || selectedType === 'combination') && (
                            <div className={styles.pickerGroup}>
                                <label className={styles.pickerLabel}>Select Shifts</label>
                                <div className={styles.pills}>
                                    {SHIFTS.map(shift => (
                                        <button
                                            key={shift}
                                            className={`${styles.pill} ${selectedShifts.includes(shift) ? styles.pillActive : ''}`}
                                            onClick={() => toggleItem(selectedShifts, setSelectedShifts, shift)}
                                        >
                                            {shift.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className={styles.actions}>
                            <button className={styles.cancelBtn} onClick={handleClose} disabled={loading}>Cancel</button>
                            <button
                                className={styles.submitBtn}
                                disabled={!canSubmit() || loading}
                                onClick={handleSubmit}
                            >
                                {loading ? 'Saving...' : 'Save Constraint'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
}
