import styles from "./ShortcutModal.module.css";

export interface EditState {
	mode: "add" | "edit";
	id?: string;
	displayName: string;
	url: string;
	color: string;
}

interface ShortcutModalProps {
	editState: EditState;
	onClose: () => void;
	onChange: (updates: Partial<EditState>) => void;
	onSave: () => void;
}

export function ShortcutModal({
	editState,
	onClose,
	onChange,
	onSave,
}: ShortcutModalProps) {
	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: modal overlay background click
		<div
			className={styles.modalOverlay}
			onClick={onClose}
			onKeyDown={(e) => e.key === "Escape" && onClose()}
		>
			<div
				className={styles.modal}
				role="dialog"
				aria-label="Edit shortcut"
				onClick={(e) => e.stopPropagation()}
				onKeyDown={(e) => e.stopPropagation()}
			>
				<div className={styles.modalTitle}>
					{editState.mode === "add" ? "Add Shortcut" : "Edit Shortcut"}
				</div>
				<label>
					Name
					<input
						type="text"
						value={editState.displayName}
						onChange={(e) => onChange({ displayName: e.target.value })}
						placeholder="e.g. ChatGPT"
					/>
				</label>
				<label>
					URL
					<input
						type="text"
						value={editState.url}
						onChange={(e) => onChange({ url: e.target.value })}
						placeholder="https://..."
					/>
				</label>
				<label>
					Color
					<input
						type="color"
						value={editState.color}
						onChange={(e) => onChange({ color: e.target.value })}
					/>
				</label>
				<div className={styles.modalActions}>
					<button type="button" className={styles.modalCancel} onClick={onClose}>
						Cancel
					</button>
					<button
						type="button"
						className={styles.modalSave}
						onClick={onSave}
						disabled={!editState.displayName || !editState.url}
					>
						Save
					</button>
				</div>
			</div>
		</div>
	);
}
