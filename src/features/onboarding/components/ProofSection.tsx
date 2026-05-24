import { Ban, Eye } from "lucide-react";
import styles from "./OnboardingOverlay.module.css";

export function ProofSection() {
	return (
		<section className="row g-2 mb-4" aria-label="Invisibility demonstration">
			<div className="col-6">
				<div className={styles.proofCard}>
					<div className="d-flex align-items-center gap-1 text-[10px] font-medium tracking-[0.8px] uppercase text-[var(--color-accent)]">
						<Eye size={13} /> You see
					</div>
					<div
						className={`${styles.proofScreen} border border-[var(--color-accent-dim)]`}
					>
						<div className={styles.proofWindowInner}>
							<div className="text-[9px] font-semibold text-[var(--color-accent)] tracking-[0.5px]">
								WHISPER
							</div>
							<div className={styles.proofWindowCursor} />
						</div>
					</div>
					<div className="text-[10px] text-[var(--color-text-muted)] text-center italic">
						Full color, sharp text
					</div>
				</div>
			</div>
			<div className="col-6">
				<div className={styles.proofCard}>
					<div className="d-flex align-items-center gap-1 text-[10px] font-medium tracking-[0.8px] uppercase text-[var(--color-danger)]">
						<Ban size={13} /> They see
					</div>
					<div className={styles.proofScreen}>
						Your desktop only — no window visible
					</div>
					<div className="text-[10px] text-[var(--color-text-muted)] text-center italic">
						Whisper is completely absent
					</div>
				</div>
			</div>
		</section>
	);
}
