import styles from "./GhostDot.module.css";

interface GhostDotProps {
	title?: string;
}

export default function GhostDot({
	title = "Whisper is shielded from screen capture",
}: GhostDotProps) {
	return (
		<div
			className={styles.ghostDot}
			title={title}
			aria-hidden="true"
		/>
	);
}
