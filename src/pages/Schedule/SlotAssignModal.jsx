import { useState, useEffect } from 'react';
import { getTalents } from '../../api/talentService';
import { validateAssignment } from '../../api/scheduleService';
import Modal from '../../components/Modal/Modal';
import styles from './SlotAssignModal.module.scss';

const SHIFT_TIMES = {
    am:     { start: '06:00', end: '16:00' },
    lounge: { start: '11:00', end: '23:59' },
    pm:     { start: '15:00', end: '23:59' },
};

export default function SlotAssignModal({ isOpen, onClose, onAssign, shiftId, dateOf, scheduleId, alreadyAssigned = [] }) {
    const [talents, setTalents] = useState([]);
    const [violations, setViolations] = useState({});
    const [loadingViolations, setLoadingViolations] = useState(false);
    const [overridePending, setOverridePending] = useState(null);

    const times = SHIFT_TIMES[shiftId] || { start: '08:00', end: '16:00' };
    const shiftLabel = { am: 'Morning (AM)', lounge: 'Lounge', pm: 'Evening (PM)' }[shiftId] || shiftId;
    const dateLabel = dateOf
        ? new Date(dateOf).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
        : '';

    useEffect(() => {
        if (isOpen) {
            setOverridePending(null);
            setViolations({});
            loadTalents();
        }
    }, [isOpen, shiftId, dateOf]);

    async function loadTalents() {
        try {
            const data = await getTalents();
            const active = data.filter(t => t.is_active);
            setTalents(active);
            validateAll(active);
        } catch (e) {
            console.error(e);
        }
    }

    async function validateAll(talentList) {
        setLoadingViolations(true);
        const results = {};
        const endForApi = times.end === '23:59' ? '23:59:00' : times.end + ':00';
        await Promise.all(
            talentList.map(async (t) => {
                try {
                    const res = await validateAssignment({
                        talent_id: t.id,
                        date_of: dateOf,
                        start_time: times.start + ':00',
                        end_time: endForApi,
                        shift_name: shiftId,
                        schedule_id: scheduleId || null,
                    });
                    results[t.id] = res.violations || [];
                } catch {
                    results[t.id] = [];
                }
            })
        );
        setViolations(results);
        setLoadingViolations(false);
    }

    function handleSelect(talent) {
        const v = violations[talent.id] || [];
        if (v.length > 0) {
            setOverridePending(talent);
        } else {
            assign(talent);
        }
    }

    function assign(talent) {
        onAssign({
            talent_id: talent.id,
            talent_name: `${talent.firstname} ${talent.lastname}`,
            tal_role: talent.tal_role,
            shift_name: shiftId,
            date_of: dateOf,
            start_time: times.start,
            end_time: times.end,
        });
        setOverridePending(null);
        onClose();
    }

    const available = talents.filter(t => !alreadyAssigned.includes(t.id));

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Assign to ${shiftLabel}`}
            footer={<button className={styles.cancelBtn} onClick={onClose}>Close</button>}>

            <div className={styles.context}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span>{dateLabel} · {shiftLabel} · {times.start}–{times.end}</span>
            </div>

            {overridePending && (
                <div className={styles.overrideBox}>
                    <div className={styles.overrideTitle}>⚠️ Constraint Violations</div>
                    <ul className={styles.violations}>
                        {(violations[overridePending.id] || []).map((v, i) => <li key={i}>{v}</li>)}
                    </ul>
                    <p className={styles.overrideQuestion}>
                        Assign <strong>{overridePending.firstname} {overridePending.lastname}</strong> anyway?
                    </p>
                    <div className={styles.overrideActions}>
                        <button className={styles.cancelBtn} onClick={() => setOverridePending(null)}>Cancel</button>
                        <button className={styles.overrideBtn} onClick={() => assign(overridePending)}>Override & Assign</button>
                    </div>
                </div>
            )}

            {!overridePending && (
                <div className={styles.list}>
                    {available.length === 0 && <p className={styles.empty}>No available staff to assign.</p>}
                    {available.map(t => {
                        const v = violations[t.id] || [];
                        const hasV = v.length > 0;
                        return (
                            <button key={t.id} className={`${styles.talentRow} ${hasV ? styles.warning : styles.clean}`} onClick={() => handleSelect(t)}>
                                <div className={styles.talentInfo}>
                                    <div className={styles.avatar}>{t.firstname[0]}{t.lastname[0]}</div>
                                    <div>
                                        <div className={styles.name}>{t.firstname} {t.lastname}</div>
                                        <div className={styles.role}>{t.tal_role} · {t.contract_type}</div>
                                    </div>
                                </div>
                                <div className={styles.status}>
                                    {loadingViolations ? (
                                        <span className={styles.checking}>checking…</span>
                                    ) : hasV ? (
                                        <span className={styles.warnBadge}>⚠️ {v.length} issue{v.length > 1 ? 's' : ''}</span>
                                    ) : (
                                        <span className={styles.okBadge}>✓ Available</span>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </Modal>
    );
}
