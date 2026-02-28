import { useState } from 'react';
import Modal from '../../components/Modal/Modal';
import { createTalent } from '../../api/talentService';
import { useToast } from '../../components/Toast/Toast';
import styles from './CreateTalentModal.module.scss';

import { formatError } from '../../utils/errorUtils';

const ROLES = ['manager', 'leader', 'bartender', 'server', 'runner', 'hostess'];
const CONTRACTS = ['full-time', 'part-time', 'student'];

export default function CreateTalentModal({ isOpen, onClose, onSuccess }) {
    const toast = useToast();
    const [loading, setLoading] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        firstname: '',
        lastname: '',
        email: '',
        tal_role: 'server',
        contract_type: 'full-time',
        start_date: new Date().toISOString().split('T')[0] // Defaults to today, YYYY-MM-DD
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await createTalent(formData);
            toast({ message: `Successfully added ${formData.firstname}.`, type: 'success' });

            // Reset form
            setFormData({
                firstname: '',
                lastname: '',
                email: '',
                tal_role: 'server',
                contract_type: 'full-time',
                start_date: new Date().toISOString().split('T')[0]
            });

            onSuccess(); // Triggers parent to reload the list
            onClose();
        } catch (error) {
            toast({ message: formatError(error), type: 'error' });
            console.error('Create talent error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add New Talent" size="md">
            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.row}>
                    <div className={styles.field}>
                        <label htmlFor="firstname">First Name</label>
                        <input
                            id="firstname"
                            name="firstname"
                            type="text"
                            required
                            value={formData.firstname}
                            onChange={handleChange}
                        />
                    </div>
                    <div className={styles.field}>
                        <label htmlFor="lastname">Last Name</label>
                        <input
                            id="lastname"
                            name="lastname"
                            type="text"
                            required
                            value={formData.lastname}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                <div className={styles.field}>
                    <label htmlFor="email">Email Address</label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                    />
                </div>

                <div className={styles.row}>
                    <div className={styles.field}>
                        <label htmlFor="tal_role">Role</label>
                        <select
                            id="tal_role"
                            name="tal_role"
                            required
                            value={formData.tal_role}
                            onChange={handleChange}
                        >
                            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                    <div className={styles.field}>
                        <label htmlFor="contract_type">Contract</label>
                        <select
                            id="contract_type"
                            name="contract_type"
                            required
                            value={formData.contract_type}
                            onChange={handleChange}
                        >
                            {CONTRACTS.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                </div>

                <div className={styles.field}>
                    <label htmlFor="start_date">Start Date</label>
                    <input
                        id="start_date"
                        name="start_date"
                        type="date"
                        required
                        value={formData.start_date}
                        onChange={handleChange}
                    />
                </div>

                <div className={styles.actions}>
                    <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={loading}>
                        Cancel
                    </button>
                    <button type="submit" className={styles.submitBtn} disabled={loading}>
                        {loading ? 'Saving...' : 'Create Talent'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
