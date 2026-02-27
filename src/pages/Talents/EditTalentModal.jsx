import { useState, useEffect } from 'react';
import Modal from '../../components/Modal/Modal';
import { updateTalent } from '../../api/talentService';
import { useToast } from '../../components/Toast/Toast';
import styles from './EditTalentModal.module.scss';

const ROLES = ['manager', 'assistant manager', 'supervisor', 'bartender', 'server', 'runner', 'hostess', 'job force'];
const CONTRACTS = ['full-time', 'part-time', 'student'];

export default function EditTalentModal({ talent, isOpen, onClose, onSuccess }) {
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        firstname: '',
        lastname: '',
        email: '',
        tal_role: '',
        contract_type: '',
    });

    // Sync form with the talent when the modal opens
    useEffect(() => {
        if (talent) {
            setFormData({
                firstname: talent.firstname,
                lastname: talent.lastname,
                email: talent.email,
                tal_role: talent.tal_role,
                contract_type: talent.contract_type,
            });
        }
    }, [talent]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await updateTalent(talent.id, formData);
            toast({ message: `${formData.firstname}'s profile has been updated.`, type: 'success' });
            onSuccess();
            onClose();
        } catch (error) {
            toast({ message: error.response?.data?.detail || 'Failed to update talent.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleDeactivate = async () => {
        if (!window.confirm(`Are you sure you want to deactivate ${talent.firstname}? This cannot be undone.`)) return;
        setLoading(true);
        try {
            await updateTalent(talent.id, { is_active: false });
            toast({ message: `${talent.firstname} has been deactivated.`, type: 'success' });
            onSuccess();
            onClose();
        } catch (error) {
            toast({ message: error.response?.data?.detail || 'Failed to deactivate talent.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Talent" size="md">
            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.row}>
                    <div className={styles.field}>
                        <label htmlFor="edit_firstname">First Name</label>
                        <input
                            id="edit_firstname"
                            name="firstname"
                            type="text"
                            required
                            value={formData.firstname}
                            onChange={handleChange}
                        />
                    </div>
                    <div className={styles.field}>
                        <label htmlFor="edit_lastname">Last Name</label>
                        <input
                            id="edit_lastname"
                            name="lastname"
                            type="text"
                            required
                            value={formData.lastname}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                <div className={styles.field}>
                    <label htmlFor="edit_email">Email Address</label>
                    <input
                        id="edit_email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                    />
                </div>

                <div className={styles.row}>
                    <div className={styles.field}>
                        <label htmlFor="edit_tal_role">Role</label>
                        <select
                            id="edit_tal_role"
                            name="tal_role"
                            value={formData.tal_role}
                            onChange={handleChange}
                        >
                            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                    <div className={styles.field}>
                        <label htmlFor="edit_contract_type">Contract</label>
                        <select
                            id="edit_contract_type"
                            name="contract_type"
                            value={formData.contract_type}
                            onChange={handleChange}
                        >
                            {CONTRACTS.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                </div>

                {/* Danger zone — only show for active talents */}
                {talent?.is_active && (
                    <div className={styles.dangerZone}>
                        <div>
                            <p className={styles.dangerTitle}>Deactivate Talent</p>
                            <p className={styles.dangerDesc}>This will remove them from future scheduling. It cannot be undone.</p>
                        </div>
                        <button
                            type="button"
                            className={styles.deactivateBtn}
                            onClick={handleDeactivate}
                            disabled={loading}
                        >
                            Deactivate
                        </button>
                    </div>
                )}

                <div className={styles.actions}>
                    <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={loading}>
                        Cancel
                    </button>
                    <button type="submit" className={styles.submitBtn} disabled={loading}>
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
