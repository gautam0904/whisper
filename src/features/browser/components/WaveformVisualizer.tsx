import { useEffect, useState } from "react";
import styles from "./WaveformVisualizer.module.css";

interface WaveformVisualizerProps {
    active: boolean;
    volume: number;
}

export default function WaveformVisualizer({ active, volume }: WaveformVisualizerProps) {
    const [heights, setHeights] = useState<number[]>([3, 3, 3, 3, 3, 3, 3]);

    useEffect(() => {
        if (!active) {
            setHeights([3, 3, 3, 3, 3, 3, 3]);
            return;
        }

        const interval = setInterval(() => {
            setHeights(() => {
                const base = Math.max(3, (volume / 100) * 16);
                return Array.from({ length: 7 }).map(() => {
                    const jitter = Math.random() * 6 - 3;
                    return Math.max(3, Math.min(18, base + jitter));
                });
            });
        }, 80);

        return () => clearInterval(interval);
    }, [active, volume]);

    return (
        <div className={styles.waveform}>
            {heights.map((h, i) => (
                <div
                    key={i}
                    className={`${styles.bar} ${active ? styles.activeBar : ""}`}
                    style={{ height: `${h}px` }}
                />
            ))}
        </div>
    );
}
