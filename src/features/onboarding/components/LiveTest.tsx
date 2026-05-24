import { Circle } from "lucide-react";
import styles from "./OnboardingOverlay.module.css";

export const TEST_STATE = {
	IDLE: "idle",
	TESTING: "testing",
	PASSED: "passed",
	FAILED: "failed",
} as const;

export type TestState = (typeof TEST_STATE)[keyof typeof TEST_STATE];

interface LiveTestButtonsProps {
	testState: TestState;
	setTestState: (s: TestState) => void;
}

export function LiveTestButtons({ testState, setTestState }: LiveTestButtonsProps) {
	return (
		<div className="mb-4">
			{testState === TEST_STATE.IDLE && (
				<button
					type="button"
					id="live-test-btn"
					className={`w-100 ${styles.liveTestBtn}`}
					onClick={() => setTestState(TEST_STATE.TESTING)}
					aria-label="Run live invisibility test"
				>
					<Circle size={12} className={styles.liveTestDot} /> Live Test — Verify
					with your meeting app right now
				</button>
			)}
			{testState === TEST_STATE.PASSED && (
				<>
					<button
						type="button"
						className={`w-100 ${styles.liveTestBtn} ${styles.success}`}
						disabled
					>
						✓ Verified Invisible
					</button>
					<div className={`${styles.testFeedback} ${styles.feedbackSuccess}`}>
						Your OS correctly excludes this window. You're protected.
					</div>
				</>
			)}
			{testState === TEST_STATE.FAILED && (
				<>
					<button
						type="button"
						className={`w-100 ${styles.liveTestBtn} ${styles.fail}`}
						disabled
					>
						Fallback Mode — Share a single app window
					</button>
					<div className={`${styles.testFeedback} ${styles.feedbackFail}`}>
						Fix: In Zoom, choose "Share Window" not "Share Entire Screen".
					</div>
				</>
			)}
		</div>
	);
}

interface LiveTestPatternProps {
	testState: TestState;
	setTestState: (s: TestState) => void;
}

export function LiveTestPattern({ testState, setTestState }: LiveTestPatternProps) {
	if (testState !== TEST_STATE.TESTING) return null;

	return (
		<div className={styles.testPattern}>
			<div className="text-[22px] font-bold text-black text-center px-6 leading-tight">
				IF YOU SEE THIS IN ZOOM/MEET,
				<br />
				SCREEN SHARE IS NOT EXCLUDED
			</div>
			<div className="text-[14px] text-[var(--color-black)] text-center px-6">
				Open Zoom → Share your entire screen → Look at the preview.
			</div>
			<div className="d-flex gap-3 mt-3">
				<button
					type="button"
					className={styles.testBtn}
					onClick={() => setTestState(TEST_STATE.FAILED)}
				>
					Yes, I see it
				</button>
				<button
					type="button"
					className={styles.testBtn}
					onClick={() => setTestState(TEST_STATE.PASSED)}
				>
					No, just my desktop
				</button>
			</div>
		</div>
	);
}
