import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTutorial, TUTORIAL_STEPS } from '../../context/TutorialContext';
import styles from './TutorialOverlay.module.scss';

const PADDING = 10;
const TOOLTIP_WIDTH = 320;
const TOOLTIP_ESTIMATED_HEIGHT = 200;

function useTargetRect(selector, isActive, stepIndex, pathname) {
    const [rect, setRect] = useState(null);
    const timerRef = useRef(null);

    useEffect(() => {
        if (!isActive) { setRect(null); return; }

        function attempt(retries) {
            const el = document.querySelector(selector);
            if (el) {
                const r = el.getBoundingClientRect();
                setRect(r);
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else if (retries > 0) {
                timerRef.current = setTimeout(() => attempt(retries - 1), 120);
            } else {
                setRect(null);
            }
        }

        timerRef.current = setTimeout(() => attempt(40), 80);
        return () => clearTimeout(timerRef.current);
    }, [selector, isActive, stepIndex, pathname]);

    // Keep rect in sync on scroll / resize
    useEffect(() => {
        if (!isActive || !rect) return;
        function sync() {
            const el = document.querySelector(selector);
            if (el) setRect(el.getBoundingClientRect());
        }
        window.addEventListener('resize', sync);
        window.addEventListener('scroll', sync, true);
        return () => {
            window.removeEventListener('resize', sync);
            window.removeEventListener('scroll', sync, true);
        };
    }, [selector, isActive, rect]);

    return rect;
}

function tooltipPosition(rect) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    if (!rect) {
        return {
            top:  vh / 2 - TOOLTIP_ESTIMATED_HEIGHT / 2,
            left: vw / 2 - TOOLTIP_WIDTH / 2,
        };
    }

    const spotBottom = rect.bottom + PADDING;
    const spotTop = rect.top - PADDING;
    const preferBelow = spotBottom + TOOLTIP_ESTIMATED_HEIGHT + 16 <= vh;
    const top = preferBelow
        ? spotBottom + 16
        : spotTop - TOOLTIP_ESTIMATED_HEIGHT - 16;

    const idealLeft = rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2;
    const left = Math.max(16, Math.min(idealLeft, vw - TOOLTIP_WIDTH - 16));

    return { top, left };
}

export default function TutorialOverlay() {
    const { isActive, stepIndex, next, prev, stop } = useTutorial();
    const navigate = useNavigate();
    const location = useLocation();
    const step = TUTORIAL_STEPS[stepIndex];

    // Navigate to the step's route if needed
    useEffect(() => {
        if (!isActive || !step) return;
        if (location.pathname !== step.route) {
            navigate(step.route);
        }
    }, [stepIndex, isActive]); // eslint-disable-line

    const rect = useTargetRect(
        step?.selector ?? '',
        isActive,
        stepIndex,
        location.pathname
    );

    if (!isActive || !step) return null;

    const spotStyle = rect
        ? {
            top:    rect.top    - PADDING,
            left:   rect.left   - PADDING,
            width:  rect.width  + PADDING * 2,
            height: rect.height + PADDING * 2,
        }
        : null;

    const { top: ttTop, left: ttLeft } = tooltipPosition(rect);
    const isFirst = stepIndex === 0;
    const isLast  = stepIndex === TUTORIAL_STEPS.length - 1;

    return (
        <div className={styles.overlay} aria-live="polite">
            {/* Dark vignette with spotlight hole */}
            {spotStyle && (
                <div className={styles.spotlight} style={spotStyle} />
            )}

            {/* Tooltip card */}
            <div
                className={styles.tooltip}
                style={{ top: ttTop, left: ttLeft }}
                role="dialog"
                aria-label={`Tutorial step ${stepIndex + 1}: ${step.title}`}
            >
                {/* Top row: step counter + exit */}
                <div className={styles.tooltipTop}>
                    <span className={styles.counter}>
                        Step {stepIndex + 1} of {TUTORIAL_STEPS.length}
                    </span>
                    <button className={styles.exitBtn} onClick={stop} aria-label="Exit tutorial">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <h3 className={styles.title}>{step.title}</h3>
                <p className={styles.description}>{step.description}</p>

                {/* Progress dots */}
                <div className={styles.dots}>
                    {TUTORIAL_STEPS.map((_, i) => (
                        <span
                            key={i}
                            className={`${styles.dot} ${i === stepIndex ? styles.dotActive : ''}`}
                        />
                    ))}
                </div>

                {/* Navigation */}
                <div className={styles.nav}>
                    <button
                        className={styles.backBtn}
                        onClick={prev}
                        disabled={isFirst}
                    >
                        Back
                    </button>
                    <button className={styles.nextBtn} onClick={next}>
                        {isLast ? 'Finish' : 'Next'}
                        {!isLast && (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <line x1="5" y1="12" x2="19" y2="12" />
                                <polyline points="12 5 19 12 12 19" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
