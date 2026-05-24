import { useEffect, useRef, useState } from "react";

export function useAudioVolume(stream: MediaStream | null): number {
    const [volume, setVolume] = useState(0);
    const animRef = useRef<number | null>(null);

    useEffect(() => {
        if (!stream) {
            setVolume(0);
            return;
        }

        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;

        const audioCtx = new AudioContextClass();
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 32;
        source.connect(analyser);
        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        let active = true;
        const checkVolume = () => {
            if (!active) return;
            analyser.getByteFrequencyData(dataArray);
            setVolume(dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length);
            animRef.current = requestAnimationFrame(checkVolume);
        };
        checkVolume();

        return () => {
            active = false;
            if (animRef.current) cancelAnimationFrame(animRef.current);
            audioCtx.close();
        };
    }, [stream]);

    return volume;
}

export default useAudioVolume;
