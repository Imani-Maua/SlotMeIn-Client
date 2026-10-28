import { createContext, useContext, useState } from 'react';

export const TUTORIAL_STEPS = [
    {
        route: '/constraints',
        selector: '[data-tutorial="add-talent"]',
        title: 'Add a Team Member',
        description: 'This is where your team lives. Click "Add Talent" to create a staff profile with their name, role, and contract type.',
    },
    {
        route: '/constraints',
        selector: '[data-tutorial="add-constraint"]',
        title: 'Set Scheduling Constraints',
        description: 'Each person can have availability rules: which days they work, which shifts they\'re allowed, or specific scheduling preferences.',
    },
    {
        route: '/shifts',
        selector: '[data-tutorial="add-shift-period"]',
        title: 'Configure Shift Periods',
        description: 'Define your shift periods and the time templates within each one. These are the building blocks every schedule is built from.',
    },
    {
        route: '/settings',
        selector: '[data-tutorial="staffing-tab"]',
        title: 'Set Staffing Rules',
        description: 'In the Staffing tab, set the minimum headcount per role for Quiet, Normal, and Busy days. SlotMeIn hits these targets when generating schedules.',
    },
    {
        route: '/settings',
        selector: '[data-tutorial="schedule-tab"]',
        title: 'Add Occupancy Forecasts',
        description: 'In the Schedule tab, enter expected occupancy percentages by day and shift. This makes your schedules demand-aware, staffing up when you expect to be busiest.',
    },
    {
        route: '/schedule',
        selector: '[data-tutorial="generate-schedule"]',
        title: 'Generate Your Schedule',
        description: 'All set! Click "Generate New Week", choose your date range, and SlotMeIn automatically builds an optimized schedule for your whole team.',
    },
];

const TutorialContext = createContext(null);

export function TutorialProvider({ children }) {
    const [isActive, setIsActive] = useState(false);
    const [stepIndex, setStepIndex] = useState(0);

    function start() {
        setStepIndex(0);
        setIsActive(true);
    }

    function stop() {
        setIsActive(false);
    }

    function next() {
        if (stepIndex < TUTORIAL_STEPS.length - 1) {
            setStepIndex(i => i + 1);
        } else {
            stop();
        }
    }

    function prev() {
        if (stepIndex > 0) setStepIndex(i => i - 1);
    }

    return (
        <TutorialContext.Provider value={{ isActive, stepIndex, start, stop, next, prev }}>
            {children}
        </TutorialContext.Provider>
    );
}

export function useTutorial() {
    const ctx = useContext(TutorialContext);
    if (!ctx) throw new Error('useTutorial must be used within a TutorialProvider');
    return ctx;
}
