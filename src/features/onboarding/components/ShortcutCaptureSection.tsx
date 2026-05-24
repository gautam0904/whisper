import type React from "react";
import KeyCap from "../../../shared/components/KeyCap/KeyCap";
import { SHORTCUT_STATUS } from "../hooks/useShortcutCapture";
import styles from "./OnboardingOverlay.module.css";

interface ShortcutCaptureSectionProps {
	capturedKeys: string[];
	shortcutStatus: string;
	conflictApp: string;
	isShaking: boolean;
	captureRef: React.RefObject<HTMLDivElement | null>;
	handleActivate: () => void;
	applyDefault: () => void;
	keyCapStatus: "conflict" | "confirmed" | "default";
}

export function ShortcutCaptureSection({
	capturedKeys,
	shortcutStatus,
	conflictApp,
	isShaking,
	captureRef,
	handleActivate,
	applyDefault,
	keyCapStatus,
}: ShortcutCaptureSectionProps) {
	return (
		<div className="mb-4">
			<div className="text-[11px] font-medium tracking-[0.7px] text-[var(--color-text-muted)] text-uppercase mb-2">
				Set Your Ghost Key
			</div>
			<div
				ref={captureRef}
				className={`${styles.captureArea} ${isShaking ? styles.shake : ""}`}
				tabIndex={0}
				onClick={handleActivate}
				onFocus={handleActivate}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
						handleActivate();
					}
				}}
				role="button"
				aria-label="Press your shortcut combination here"
			>
				<div
					className="d-flex align-items-center justify-content-center gap-2"
					style={{ minHeight: "var(--space-12)" }}
				>
					{capturedKeys.length === 0 ? (
						<span className={styles.placeholder}>
							Click here, then press your shortcut…
						</span>
					) : (
						capturedKeys.map((key, i) => (
							<span key={key} className="d-flex align-items-center gap-2">
								<KeyCap label={key} status={keyCapStatus} />
								{i < capturedKeys.length - 1 && (
									<span className="text-[14px] text-[var(--color-text-muted)]">
										+
									</span>
								)}
							</span>
						))
					)}
				</div>
				{shortcutStatus === SHORTCUT_STATUS.WAITING &&
					capturedKeys.length === 0 && (
						<div className="text-[11px] text-[var(--color-text-muted)] text-center">
							Waiting for key combo…
						</div>
					)}
				{shortcutStatus === SHORTCUT_STATUS.CAPTURED && (
					<div className="text-[11px] text-[var(--color-success)] text-center">
						Available — no conflicts detected
					</div>
				)}
				{shortcutStatus === SHORTCUT_STATUS.CONFLICT && (
					<div className="text-[11px] text-[var(--color-danger)] text-center">
						Conflicts with {conflictApp}. Try Ctrl+Shift+W instead.
					</div>
				)}
				<div className="text-[11px] text-[var(--color-text-muted)] text-center">
					Recommended: Ctrl + Shift + W —{" "}
					<button
						type="button"
						className="text-[var(--color-accent)] cursor-pointer underline bg-transparent border-0 p-0"
						onClick={(e) => {
							e.stopPropagation();
							applyDefault();
						}}
					>
						Use this
					</button>
				</div>
			</div>
		</div>
	);
}
