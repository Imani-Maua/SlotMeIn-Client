import { createContext, useContext, useState, useEffect } from 'react';
import { getJobResult } from '../api/scheduleService';

const JobContext = createContext(null);

// notification shape: null | { type: 'done', scheduleId, weekStart, weekEnd }
//                              | { type: 'failed', error }
//                              | { type: 'timeout' | 'error' }

export function JobProvider({ children }) {
    const [pendingJobId, setPendingJobId] = useState(null);
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        if (!pendingJobId) return;
        let cancelled = false;
        const INTERVAL_MS = 2000;
        const deadline = Date.now() + 90_000;

        const check = async () => {
            if (cancelled) return;
            if (Date.now() > deadline) {
                if (!cancelled) { setNotification({ type: 'timeout' }); setPendingJobId(null); }
                return;
            }
            try {
                const data = await getJobResult(pendingJobId);
                if (data.status === 'done') {
                    if (!cancelled) {
                        setNotification({
                            type:       'done',
                            scheduleId: data.result.schedule_id,
                            weekStart:  data.result.week_start,
                            weekEnd:    data.result.week_end,
                        });
                        setPendingJobId(null);
                    }
                } else if (data.status === 'failed') {
                    if (!cancelled) {
                        setNotification({ type: 'failed', error: data.error });
                        setPendingJobId(null);
                    }
                } else {
                    setTimeout(check, INTERVAL_MS);
                }
            } catch {
                if (!cancelled) {
                    setNotification({ type: 'error' });
                    setPendingJobId(null);
                }
            }
        };

        setTimeout(check, INTERVAL_MS);
        return () => { cancelled = true; };
    }, [pendingJobId]);

    return (
        <JobContext.Provider value={{ pendingJobId, setPendingJobId, notification, setNotification }}>
            {children}
        </JobContext.Provider>
    );
}

export const useJob = () => useContext(JobContext);
