import { useState, useEffect, useMemo } from 'react';
import { getTalents } from '../../api/talentService';
import { useToast } from '../../components/Toast/Toast';
import DataTable from '../../components/DataTable/DataTable';
import EmptyState from '../../components/EmptyState/EmptyState';
import styles from './Talents.module.scss';
import Spinner from '../../components/Spinner/Spinner';
import CreateTalentModal from './CreateTalentModal';
import TalentDetailModal from './TalentDetailModal';

const ROLES = ['manager', 'leader', 'bartender', 'server', 'runner', 'hostess', 'job force'];
const CONTRACTS = ['full-time', 'part-time', 'student'];

export default function Talents() {
    const toast = useToast();
    const [talents, setTalents] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [contractFilter, setContractFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive'

    // Modals state
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedTalent, setSelectedTalent] = useState(null); // For detail/edit/constraints modal

    useEffect(() => {
        fetchTalents();
    }, []);

    async function fetchTalents() {
        setLoading(true);
        try {
            const data = await getTalents();
            setTalents(data);
        } catch (error) {
            toast({ message: 'Failed to load talents', type: 'error' });
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    // Filter logic
    const filteredTalents = useMemo(() => {
        return talents.filter(t => {
            const matchesSearch = `${t.firstname} ${t.lastname}`.toLowerCase().includes(search.toLowerCase());
            const matchesRole = roleFilter ? t.tal_role === roleFilter : true;
            const matchesContract = contractFilter ? t.contract_type === contractFilter : true;
            const matchesStatus = statusFilter === 'all' ? true :
                statusFilter === 'active' ? t.is_active : !t.is_active;

            return matchesSearch && matchesRole && matchesContract && matchesStatus;
        });
    }, [talents, search, roleFilter, contractFilter, statusFilter]);

    // Setup DataTable columns
    const columns = [
        {
            key: 'name',
            label: 'Name',
            render: (row) => <span className={styles.nameCell}>{row.firstname} {row.lastname}</span>
        },
        {
            key: 'tal_role',
            label: 'Role',
            render: (row) => <span className={styles.badge}>{row.tal_role}</span>
        },
        {
            key: 'contract_type',
            label: 'Contract',
            render: (row) => <span className={styles.badgeLine}>{row.contract_type}</span>
        },
        {
            key: 'is_active',
            label: 'Status',
            render: (row) => (
                <span className={`${styles.statusBadge} ${row.is_active ? styles.active : styles.inactive}`}>
                    {row.is_active ? 'Active' : 'Inactive'}
                </span>
            )
        },
        {
            key: 'constraints',
            label: 'Availability',
            render: (row) => (
                <div className={styles.constraintsCell}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span>Manage</span>
                </div>
            )
        }
    ];

    if (loading && talents.length === 0) {
        return <Spinner fullScreen />;
    }

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Talents</h1>
                    <p className={styles.subtitle}>Manage your team members and their availability.</p>
                </div>
                <button className={styles.addBtn} onClick={() => setIsCreateModalOpen(true)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add Talent
                </button>
            </div>

            <div className={styles.filtersCard}>
                <div className={styles.searchGroup}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search talents..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className={styles.filterDropdowns}>
                    <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                        <option value="">All Roles</option>
                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>

                    <select value={contractFilter} onChange={(e) => setContractFilter(e.target.value)}>
                        <option value="">All Contracts</option>
                        {CONTRACTS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>

                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="all">All Statuses</option>
                        <option value="active">Active Only</option>
                        <option value="inactive">Inactive Only</option>
                    </select>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={filteredTalents}
                isLoading={loading}
                onRowClick={(talent) => setSelectedTalent(talent)}
                emptyState={
                    <EmptyState
                        icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>}
                        title={search || roleFilter || contractFilter ? "No matches found" : "No talents yet"}
                        description={search || roleFilter || contractFilter ? "Try adjusting your filters to find who you're looking for." : "Start building your team by adding your first talent."}
                        action={!search && !roleFilter && !contractFilter && (
                            <button className={styles.addBtn} onClick={() => setIsCreateModalOpen(true)}>Add Talent</button>
                        )}
                    />
                }
            />

            <CreateTalentModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={fetchTalents}
            />

            <TalentDetailModal
                talent={selectedTalent}
                isOpen={!!selectedTalent}
                onClose={() => setSelectedTalent(null)}
                onSuccess={fetchTalents}
            />
        </div>
    );
}
