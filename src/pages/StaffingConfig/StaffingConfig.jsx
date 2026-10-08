import { useState, useEffect, useCallback } from 'react';
import { getStaffingRules, updateStaffingRule } from '../../api/staffingService';
import { useToast } from '../../components/Toast/Toast';
import Spinner from '../../components/Spinner/Spinner';
import { formatError } from '../../utils/errorUtils';
import styles from './StaffingConfig.module.scss';

const ROLES = ['manager', 'leader', 'bartender', 'server', 'runner', 'hostess'];
const TIERS = ['low', 'med', 'high'];
const TIER_LABELS = { low: 'Low', med: 'Medium', high: 'High' };

function buildGrid(rules) {
    const grid = {};
    for (const role of ROLES) {
        grid[role] = { low: 0, med: 0, high: 0 };
    }
    for (const rule of rules) {
        if (grid[rule.role]) {
            grid[rule.role][rule.tier] = rule.count;
        }
    }
    return grid;
}

function gridsEqual(a, b) {
    for (const role of ROLES) {
        for (const tier of TIERS) {
            if (Number(a[role][tier]) !== Number(b[role][tier])) return false;
        }
    }
    return true;
}

export default function StaffingConfig() {
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState({});
    const [draft, setDraft] = useState({});

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const rules = await getStaffingRules();
            const grid = buildGrid(rules);
            setSaved(grid);
            setDraft(grid);
        } catch (err) {
            toast({ message: formatError(err), type: 'error' });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    function handleChange(role, tier, value) {
        const num = value === '' ? '' : Math.max(0, Math.min(20, parseInt(value, 10) || 0));
        setDraft(prev => ({
            ...prev,
            [role]: { ...prev[role], [tier]: num },
        }));
    }

    const isDirty = !loading && !gridsEqual(saved, draft);

    async function handleSave() {
        setSaving(true);
        const updates = [];
        for (const role of ROLES) {
            for (const tier of TIERS) {
                if (Number(draft[role][tier]) !== Number(saved[role][tier])) {
                    updates.push({ role, tier, count: Number(draft[role][tier]) });
                }
            }
        }
        const results = await Promise.allSettled(
            updates.map(({ role, tier, count }) => updateStaffingRule(role, tier, count))
        );
        const failed = results.filter(r => r.status === 'rejected');
        if (failed.length === 0) {
            toast({ message: 'Staffing configuration saved.', type: 'success' });
            setSaved({ ...draft });
        } else {
            toast({ message: `${failed.length} rule(s) failed to save. Please retry.`, type: 'error' });
            await load();
        }
        setSaving(false);
    }

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1 className={styles.title}>Staffing Configuration</h1>
                <p className={styles.subtitle}>
                    Set how many staff per role are required for each demand tier.
                </p>
            </div>

            <p className={styles.infoBox}>
                The scheduler uses these counts when building a week&apos;s shift slots.
                <strong> Low</strong> applies to Mon–Tue, <strong>Medium</strong> to Wed–Thu,
                and <strong>High</strong> to Fri–Sun — unless the ML predictor overrides the
                tier based on occupancy percentage.
            </p>

            {loading ? (
                <div className={styles.center}><Spinner /></div>
            ) : (
                <div className={styles.card}>
                    <div className={styles.tableWrap}>
                        <table className={styles.grid}>
                            <thead>
                                <tr>
                                    <th>Role</th>
                                    {TIERS.map(tier => (
                                        <th key={tier} className={`${styles.tierHeader} ${styles[tier]}`}>
                                            {TIER_LABELS[tier]}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {ROLES.map(role => (
                                    <tr key={role}>
                                        <td className={styles.roleLabel}>{role}</td>
                                        {TIERS.map(tier => {
                                            const isDirtyCell = Number(draft[role][tier]) !== Number(saved[role][tier]);
                                            return (
                                                <td key={tier}>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="20"
                                                        step="1"
                                                        value={draft[role]?.[tier] ?? 0}
                                                        onChange={e => handleChange(role, tier, e.target.value)}
                                                        className={`${styles.tierInput} ${isDirtyCell ? styles.dirty : ''}`}
                                                    />
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className={styles.saveBar}>
                        {isDirty && <span className={styles.hint}>You have unsaved changes.</span>}
                        <button
                            className={styles.saveBtn}
                            onClick={handleSave}
                            disabled={!isDirty || saving}
                        >
                            {saving ? 'Saving…' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
