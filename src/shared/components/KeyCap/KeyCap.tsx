import styles from "./KeyCap.module.css";

interface KeyCapProps {
	label: string;
	status?: "default" | "conflict" | "confirmed";
}

export default function KeyCap({ label, status = "default" }: KeyCapProps) {
	const classMap: Record<string, string> = {
		default: styles.keycap,
		conflict: `${styles.keycap} ${styles.conflict}`,
		confirmed: `${styles.keycap} ${styles.confirmed}`,
	};

	return <span className={classMap[status]}>{label}</span>;
}
