import { useState, useEffect, useCallback } from 'react';
import { getStaffingRules, updateStaffingRule } from '../../api/staffingService';
import { getSchedulerConfig, saveSchedulerConfig } from '../../api/scheduleService';
import { useToast } from '../../components/Toast/Toast';
import Spinner from '../../components/Spinner/Spinner';
import { formatError } from '../../utils/errorUtils';
import styles from './Settings.module.scss';

// ─── Staffing helpers ─────────────────────────────────────────────────────────

const ROLES = ['manager', 'leader', 'bartender', 'server', 'runner', 'hostess'];
const TIERS = ['low', 'med', 'high'];
const TIER_LABELS = { low: 'Quiet', med: 'Normal', high: 'Busy' };

function buildGrid(rules) {
    const grid = {};
    for (const role of ROLES) grid[role] = { low: 0, med: 0, high: 0 };
    for (const rule of rules) {
        if (grid[rule.role]) grid[rule.role][rule.tier] = rule.count;
    }
    return grid;
}

function gridsEqual(a, b) {
    for (const role of ROLES)
        for (const tier of TIERS)
            if (Number(a[role][tier]) !== Number(b[role][tier])) return false;
    return true;
}

// ─── Schedule helpers ─────────────────────────────────────────────────────────

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function emptyOccupancy() {
    return Object.fromEntries(WEEKDAYS.map(d => [d, { morning: '', afternoon: '' }]));
}

function apiToState(config) {
    const occ = emptyOccupancy();
    for (const day of WEEKDAYS) {
        const entry = config.occupancy_by_weekday?.[day];
        if (!entry) continue;
        occ[day] = {
            morning:   entry.morning   != null ? String(Math.round(entry.morning   * 100)) : '',
            afternoon: entry.afternoon != null ? String(Math.round(entry.afternoon * 100)) : '',
        };
    }
    return occ;
}

function stateToApi(useWeather, occ) {
    const occupancy_by_weekday = {};
    for (const day of WEEKDAYS) {
        const morning   = occ[day].morning   !== '' ? parseFloat(occ[day].morning)   / 100 : null;
        const afternoon = occ[day].afternoon !== '' ? parseFloat(occ[day].afternoon) / 100 : null;
        if (morning !== null || afternoon !== null)
            occupancy_by_weekday[day] = { morning, afternoon };
    }
    return { use_weather: useWeather, occupancy_by_weekday };
}

// ─── Component ────────────────────────────────────────────────────────────────

const TABS = [
    { key: 'staffing', label: 'Staffing' },
    { key: 'schedule', label: 'Schedule' },
];

export default function Settings() {
    const toast = useToast();
    const [activeTab, setActiveTab] = useState('staffing');

    // Staffing state
    const [loadingStaffing, setLoadingStaffing] = useState(true);
    const [savingStaffing,  setSavingStaffing]  = useState(false);
    const [saved,  setSaved]  = useState(() => buildGrid([]));
    const [draft,  setDraft]  = useState(() => buildGrid([]));

    // Schedule state
    const [loadingSchedule, setLoadingSchedule] = useState(true);
    const [savingSchedule,  setSavingSchedule]  = useState(false);
    const [useWeather,    setUseWeather]    = useState(true);
    const [savedWeather,  setSavedWeather]  = useState(true);
    const [occ,           setOcc]           = useState(emptyOccupancy);
    const [savedOcc,      setSavedOcc]      = useState(emptyOccupancy);

    const loadStaffing = useCallback(async () => {
        setLoadingStaffing(true);
        try {
            const rules = await getStaffingRules();
            const grid = buildGrid(rules);
            setSaved(grid);
            setDraft(grid);
        } catch (err) {
            toast({ message: formatError(err), type: 'error' });
        } finally {
            setLoadingStaffing(false);
        }
    }, []);

    const loadSchedule = useCallback(async () => {
        setLoadingSchedule(true);
        try {
            const config = await getSchedulerConfig();
            setUseWeather(config.use_weather);
            setSavedWeather(config.use_weather);
            const state = apiToState(config);
            setOcc(state);
            setSavedOcc(state);
        } catch (err) {
            toast({ message: formatError(err), type: 'error' });
        } finally {
            setLoadingSchedule(false);
        }
    }, []);

    useEffect(() => { loadStaffing(); loadSchedule(); }, [loadStaffing, loadSchedule]);

    // Staffing handlers
    function handleStaffingChange(role, tier, value) {
        const num = value === '' ? '' : Math.max(0, Math.min(20, parseInt(value, 10) || 0));
        setDraft(prev => ({ ...prev, [role]: { ...prev[role], [tier]: num } }));
    }

    const staffingDirty = !loadingStaffing && !gridsEqual(saved, draft);

    async function handleSaveStaffing() {
        setSavingStaffing(true);
        const updates = [];
        for (const role of ROLES)
            for (const tier of TIERS)
                if (Number(draft[role][tier]) !== Number(saved[role][tier]))
                    updates.push({ role, tier, count: Number(draft[role][tier]) });

        const results = await Promise.allSettled(
            updates.map(({ role, tier, count }) => updateStaffingRule(role, tier, count))
        );
        const failed = results.filter(r => r.status === 'rejected');
        if (failed.length === 0) {
            toast({ message: 'Staffing saved.', type: 'success' });
            setSaved({ ...draft });
        } else {
            toast({ message: `${failed.length} rule(s) failed to save.`, type: 'error' });
            await loadStaffing();
        }
        setSavingStaffing(false);
    }

    // Schedule handlers
    function handleOccChange(day, shift, value) {
        const num = value === '' ? '' : String(Math.max(0, Math.min(100, parseInt(value, 10) || 0)));
        setOcc(prev => ({ ...prev, [day]: { ...prev[day], [shift]: num } }));
    }

    const scheduleDirty = !loadingSchedule && (
        useWeather !== savedWeather ||
        WEEKDAYS.some(d =>
            occ[d].morning !== savedOcc[d].morning ||
            occ[d].afternoon !== savedOcc[d].afternoon
        )
    );

    async function handleSaveSchedule() {
        setSavingSchedule(true);
        try {
            await saveSchedulerConfig(stateToApi(useWeather, occ));
            setSavedWeather(useWeather);
            setSavedOcc(occ);
            toast({ message: 'Schedule settings saved.', type: 'success' });
        } catch (err) {
            toast({ message: formatError(err), type: 'error' });
        } finally {
            setSavingSchedule(false);
        }
    }

    const loading = activeTab === 'staffing' ? loadingStaffing : loadingSchedule;

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1 className={styles.title}>Settings</h1>
            </div>

            <div className={styles.tabs}>
                {TABS.map(tab => (
                    <button
                        key={tab.key}
                        data-tutorial={tab.key === 'staffing' ? 'staffing-tab' : tab.key === 'schedule' ? 'schedule-tab' : undefined}
                        className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab(tab.key)}
                    >
                        {tab.label}
                        {tab.key === 'staffing' && staffingDirty && <span className={styles.tabDot} />}
                        {tab.key === 'schedule' && scheduleDirty && <span className={styles.tabDot} />}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className={styles.center}><Spinner /></div>
            ) : activeTab === 'staffing' ? (
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <span className={styles.cardTitle}>Headcount per demand level</span>
                        <span className={styles.infoTip}>
                            <span className={styles.infoIcon}>i</span>
                            <span className={styles.tooltip}>
                                Staffing levels for each day type. Days default to Quiet (Mon–Tue),
                                Normal (Wed–Thu) or Busy (Fri–Sun), and may shift based on your
                                occupancy forecast.
                            </span>
                        </span>
                    </div>
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
                                                        onChange={e => handleStaffingChange(role, tier, e.target.value)}
                                                        className={`${styles.numInput} ${isDirtyCell ? styles.dirty : ''}`}
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
                        {staffingDirty && <span className={styles.hint}>You have unsaved changes.</span>}
                        <button
                            className={styles.saveBtn}
                            onClick={handleSaveStaffing}
                            disabled={!staffingDirty || savingStaffing}
                        >
                            {savingStaffing ? 'Saving…' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <span className={styles.cardTitle}>Data Sources</span>
                        </div>
                        <div className={styles.toggleRow}>
                            <div>
                                <div className={styles.toggleLabel}>Live weather forecast</div>
                                <div className={styles.toggleDesc}>
                                    Fetches a 14-day temperature forecast for Budapest.
                                    Improves demand predictions. Disable to use seasonal averages.
                                </div>
                            </div>
                            <button
                                role="switch"
                                aria-checked={useWeather}
                                className={`${styles.toggle} ${useWeather ? styles.toggleOn : ''}`}
                                onClick={() => setUseWeather(v => !v)}
                            >
                                <span className={styles.toggleThumb} />
                            </button>
                        </div>
                    </div>

                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <span className={styles.cardTitle}>Default Occupancy by Weekday</span>
                            <span className={styles.infoTip}>
                                <span className={styles.infoIcon}>i</span>
                                <span className={styles.tooltip}>
                                    Applied each time you generate a schedule. Occupancy forecasts
                                    help SlotMeIn predict demand; any day left blank uses its usual
                                    weekday level.
                                </span>
                            </span>
                        </div>
                        <div className={styles.tableWrap}>
                            <table className={styles.grid}>
                                <thead>
                                    <tr>
                                        <th>Day</th>
                                        <th>Morning %</th>
                                        <th>Afternoon %</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {WEEKDAYS.map(day => (
                                        <tr key={day}>
                                            <td className={styles.roleLabel}>{day}</td>
                                            {['morning', 'afternoon'].map(shift => {
                                                const isDirtyCell = occ[day][shift] !== savedOcc[day][shift];
                                                return (
                                                    <td key={shift}>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            step="1"
                                                            placeholder="—"
                                                            value={occ[day][shift]}
                                                            onChange={e => handleOccChange(day, shift, e.target.value)}
                                                            className={`${styles.numInput} ${isDirtyCell ? styles.dirty : ''}`}
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
                            {scheduleDirty && <span className={styles.hint}>You have unsaved changes.</span>}
                            <button
                                className={styles.saveBtn}
                                onClick={handleSaveSchedule}
                                disabled={!scheduleDirty || savingSchedule}
                            >
                                {savingSchedule ? 'Saving…' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
