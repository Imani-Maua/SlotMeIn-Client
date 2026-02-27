import { useState, useEffect } from 'react';
import Modal from '../../components/Modal/Modal';
import { getConstraints, createConstraint, deleteConstraint } from '../../api/constraintService';
import { useToast } from '../../components/Toast/Toast';
import styles from './TalentDetailModal.module.scss';
import Spinner from '../../components/Spinner/Spinner';
import EditTalentModal from './EditTalentModal';

export default function TalentDetailModal({ talent, isOpen, onClose, onSuccess }) {
    const toast = useToast();
    const [constraintsLoading, setConstraintsLoading] = useState(false);
    const [constraints, setConstraints] = useState([]);
    const [isEditOpen, setIsEditOpen] = useState(false);

    useEffect(() => {
        if (isOpen && talent) {
            fetchConstraints();
        } else {
            setConstraints([]);
        }
    }, [isOpen, talent]);

    async function fetchConstraints() {
        setConstraintsLoading(true);
        try {
            const data = await getConstraints({ talent_id: talent.id });
            setConstraints(data);
        } catch (error) {
            if (error.response?.status !== 404) {
                toast({ message: 'Failed to load constraints', type: 'error' });
            }
        } finally {
            setConstraintsLoading(false);
        }
    }

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title="Talent Profile" size="lg">
                {!talent ? (
                    <Spinner />
                ) : (
                    <div className={styles.container}>
                        {/* Basic Info Section */}
                        <div className={styles.headerSection}>
                            <div className={styles.avatar}>
                                {talent.firstname[0]}{talent.lastname[0]}
                            </div>
                            <div className={styles.info}>
                                <h2 className={styles.name}>{talent.firstname} {talent.lastname}</h2>
                                <p className={styles.email}>{talent.email}</p>
                                <div className={styles.badges}>
                                    <span className={styles.roleBadge}>{talent.tal_role}</span>
                                    <span className={styles.contractBadge}>{talent.contract_type}</span>
                                    <span className={`${styles.statusBadge} ${talent.is_active ? styles.active : styles.inactive}`}>
                                        {talent.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>
                            {/* Edit button top-right of header */}
                            <button className={styles.editBtn} onClick={() => setIsEditOpen(true)}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                                Edit
                            </button>
                        </div>

                        <div className={styles.divider} />

                        {/* Constraints Section */}
                        <div className={styles.constraintsSection}>
                            <div className={styles.sectionHeader}>
                                <h3>Availability & Constraints</h3>
                                <button className={styles.addConstraintBtn}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                                    </svg>
                                    Add Rule
                                </button>
                            </div>

                            {constraintsLoading ? (
                                <div style={{ padding: '2rem 0', display: 'flex', justifyContent: 'center' }}><Spinner /></div>
                            ) : constraints.length === 0 ? (
                                <div className={styles.emptyConstraints}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                                    </svg>
                                    <p>No constraints set. {talent.firstname} is fully available for scheduling.</p>
                                </div>
                            ) : (
                                <div className={styles.constraintsList}>
                                    {constraints.map(c => (
                                        <div key={c.type} className={styles.constraintCard}>
                                            <div className={styles.constraintHeader}>
                                                <span className={styles.constraintType}>{c.type}</span>
                                                <button className={styles.deleteBtn}>
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                        <path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                    </svg>
                                                </button>
                                            </div>
                                            <div className={styles.rulesList}>
                                                {c.rules && c.rules.map((rule, idx) => (
                                                    <div key={idx} className={styles.rulePill}>
                                                        {rule.day} — {rule.shifts}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Modal>

            {/* Edit modal — stacked on top of the profile modal */}
            <EditTalentModal
                talent={talent}
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                onSuccess={() => {
                    onSuccess();        // Refreshes the main talents list
                    onClose();          // Closes the profile modal too
                }}
            />
        </>
    );
}
