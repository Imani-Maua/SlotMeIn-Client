import { useState, useEffect, useCallback } from 'react';
import { getSchedulerConfig, saveSchedulerConfig } from '../../api/scheduleService';
import { useToast } from '../../components/Toast/Toast';
import Spinner from '../../components/Spinner/Spinner';
import { formatError } from '../../utils/errorUtils';
import styles from './SchedulerSettings.module.scss';

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
        if (morning !== null || afternoon !== null) {
            occupancy_by_weekday[day] = { morning, afternoon };
        }
    }
    return { use_weather: useWeather, occupancy_by_weekday };
}

export default function SchedulerSettings() {
    const toast = useToast();
    const [loading,    setLoading]    = useState(true);
    const [saving,     setSaving]     = useState(false);
    const [useWeather, setUseWeather] = useState(true);
    const [savedWeather, setSavedWeather] = useState(true);
    const [occ,        setOcc]        = useState(emptyOccupancy);
    const [savedOcc,   setSavedOcc]   = useState(emptyOccupancy);

    const load = useCallback(async () => {
        setLoading(true);
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
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    function handleOccChange(day, shift, value) {
        const num = value === '' ? '' : String(Math.max(0, Math.min(100, parseInt(value, 10) || 0)));
        setOcc(prev => ({ ...prev, [day]: { ...prev[day], [shift]: num } }));
    }

    const isDirty = !loading && (
        useWeather !== savedWeather ||
        WEEKDAYS.some(d =>
            occ[d].morning !== savedOcc[d].morning ||
            occ[d].afternoon !== savedOcc[d].afternoon
        )
    );

    function handleClearAll() {
        setOcc(emptyOccupancy());
    }

    const hasAnyOccupancy = WEEKDAYS.some(
        d => occ[d].morning !== '' || occ[d].afternoon !== ''
    );

    async function handleSave() {
        setSaving(true);
        try {
            await saveSchedulerConfig(stateToApi(useWeather, occ));
            setSavedWeather(useWeather);
            setSavedOcc(occ);
            toast({ message: 'Configuration saved.', type: 'success' });
        } catch (err) {
            toast({ message: formatError(err), type: 'error' });
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1 className={styles.title}>Settings</h1>
                <p className={styles.subtitle}>
                    Control how the engine generates weekly schedules.
                </p>
            </div>

            <span className={styles.infoTip}>
                <span className={styles.infoIcon}>i</span>
                <span className={styles.tooltip}>
                    Applied each time you generate a schedule. Occupancy forecasts help SlotMeIn
                    predict demand; any day left blank uses its usual weekday level.
                </span>
            </span>

            {loading ? (
                <div className={styles.center}><Spinner /></div>
            ) : (
                <>
                    {/* Data Sources */}
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <span className={styles.cardTitle}>Data Sources</span>
                        </div>
                        <div className={styles.toggleRow}>
                            <div>
                                <div className={styles.toggleLabel}>Live weather forecast</div>
                                <div className={styles.toggleDesc}>
                                    Fetches a 14-day temperature forecast from Open-Meteo for Budapest.
                                    Improves demand tier predictions. Disable to use seasonal averages.
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

                    {/* Occupancy Defaults */}
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <span className={styles.cardTitle}>Default Occupancy by Weekday</span>
                            <div className={styles.cardHeaderRight}>
                                <span className={styles.cardNote}>Leave blank to use day-of-week defaults</span>
                                <button
                                    className={styles.clearBtn}
                                    onClick={handleClearAll}
                                    disabled={!hasAnyOccupancy}
                                    type="button"
                                >
                                    Clear all
                                </button>
                            </div>
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
                                            <td className={styles.dayLabel}>{day}</td>
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
                                                            className={`${styles.occInput} ${isDirtyCell ? styles.dirty : ''}`}
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
                </>
            )}
        </div>
    );
}
