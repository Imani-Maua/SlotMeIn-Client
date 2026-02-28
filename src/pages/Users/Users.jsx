import { useState, useEffect, useCallback } from 'react';
import { listUsers, createUser, sendInvite } from '../../api/userService';
import { useToast } from '../../components/Toast/Toast';
import Modal from '../../components/Modal/Modal';
import Spinner from '../../components/Spinner/Spinner';
import { formatError } from '../../utils/errorUtils';
import styles from './Users.module.scss';

const ROLES = ['manager', 'superuser'];

const getRoleColor = (role) => {
    switch (role) {
        case 'superuser': return styles.roleSuperuser;
        case 'manager': return styles.roleManager;
        default: return styles.roleDefault;
    }
};

export default function Users() {
    const toast = useToast();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [invitingId, setInvitingId] = useState(null);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const data = await listUsers();
            setUsers(data);
        } catch (err) {
            toast({ message: formatError(err), type: 'error' });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const handleSendInvite = async (userId, email) => {
        if (!window.confirm(`Send an invitation email to ${email}?`)) return;
        setInvitingId(userId);
        try {
            await sendInvite(userId);
            toast({ message: `Invite sent to ${email}!`, type: 'success' });
        } catch (err) {
            toast({ message: formatError(err), type: 'error' });
        } finally {
            setInvitingId(null);
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>User Management</h1>
                    <p className={styles.subtitle}>Manage system users and send invitations.</p>
                </div>
                <button className={styles.primaryBtn} onClick={() => setIsCreateOpen(true)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add User
                </button>
            </div>

            {loading ? (
                <div className={styles.center}><Spinner /></div>
            ) : (
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Username</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id}>
                                    <td className={styles.nameCell}>
                                        <div className={styles.avatar}>
                                            {user.firstname[0]}{user.lastname[0]}
                                        </div>
                                        <span>{user.firstname} {user.lastname}</span>
                                    </td>
                                    <td className={styles.mono}>{user.username}</td>
                                    <td>{user.email}</td>
                                    <td>
                                        <span className={`${styles.roleBadge} ${getRoleColor(user.user_role)}`}>
                                            {user.user_role}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`${styles.statusBadge} ${user.is_active ? styles.statusActive : styles.statusPending}`}>
                                            {user.is_active ? 'Active' : 'Pending'}
                                        </span>
                                    </td>
                                    <td>
                                        {!user.is_active && (
                                            <button
                                                className={styles.inviteBtn}
                                                onClick={() => handleSendInvite(user.id, user.email)}
                                                disabled={invitingId === user.id}
                                            >
                                                {invitingId === user.id ? (
                                                    <span className={styles.invitingText}>Sending…</span>
                                                ) : (
                                                    <>
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                            <line x1="22" y1="2" x2="11" y2="13" />
                                                            <polygon points="22 2 15 22 11 13 2 9 22 2" />
                                                        </svg>
                                                        Send Invite
                                                    </>
                                                )}
                                            </button>
                                        )}
                                        {user.is_active && (
                                            <span className={styles.activeLabel}>✓ Joined</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {users.length === 0 && (
                        <div className={styles.emptyState}>
                            <p>No users yet. Add your first user to get started.</p>
                        </div>
                    )}
                </div>
            )}

            <CreateUserModal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onSuccess={() => { setIsCreateOpen(false); fetchUsers(); }}
            />
        </div>
    );
}

function CreateUserModal({ isOpen, onClose, onSuccess }) {
    const toast = useToast();
    const [formData, setFormData] = useState({
        firstname: '', lastname: '', email: '', user_role: 'manager'
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await createUser(formData);
            toast({ message: `User ${formData.firstname} created! Send them an invite to activate their account.`, type: 'success' });
            onSuccess();
            setFormData({ firstname: '', lastname: '', email: '', user_role: 'manager' });
        } catch (err) {
            toast({ message: formatError(err), type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Add New User"
            footer={
                <>
                    <button className={styles.cancelBtn} onClick={onClose} disabled={loading}>Cancel</button>
                    <button className={styles.submitBtn} onClick={handleSubmit} disabled={loading || !formData.firstname || !formData.lastname || !formData.email}>
                        {loading ? 'Creating…' : 'Create User'}
                    </button>
                </>
            }
        >
            <form className={styles.form} onSubmit={handleSubmit}>
                <p className={styles.formHint}>
                    A user account will be created. You'll then be able to send them an invitation
                    email so they can set their password and activate their account.
                </p>
                <div className={styles.row}>
                    <div className={styles.formGroup}>
                        <label>First Name</label>
                        <input
                            type="text"
                            placeholder="Jane"
                            value={formData.firstname}
                            onChange={e => setFormData({ ...formData, firstname: e.target.value })}
                            required
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Last Name</label>
                        <input
                            type="text"
                            placeholder="Doe"
                            value={formData.lastname}
                            onChange={e => setFormData({ ...formData, lastname: e.target.value })}
                            required
                        />
                    </div>
                </div>
                <div className={styles.formGroup}>
                    <label>Email Address</label>
                    <input
                        type="email"
                        placeholder="jane.doe@example.com"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        required
                    />
                </div>
                <div className={styles.formGroup}>
                    <label>Role</label>
                    <select
                        value={formData.user_role}
                        onChange={e => setFormData({ ...formData, user_role: e.target.value })}
                    >
                        {ROLES.map(r => (
                            <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                        ))}
                    </select>
                </div>
            </form>
        </Modal>
    );
}
