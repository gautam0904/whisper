import { useEffect, useState } from "react";

export function useSystemAudioDevice() {
    const [deviceId, setDeviceId] = useState<string | undefined>(undefined);
    const [deviceLabel, setDeviceLabel] = useState<string | null>(null);
    const [found, setFound] = useState<boolean>(false);

    useEffect(() => {
        const checkDevices = async () => {
            if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
                return;
            }
            try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                const audioInputs = devices.filter((d) => d.kind === "audioinput");
                
                // Find BlackHole on mac, or VB-Cable / CABLE on Windows
                const virtualInput = audioInputs.find(
                    (d) =>
                        d.label &&
                        (d.label.toLowerCase().includes("blackhole") ||
                         d.label.toLowerCase().includes("vb-audio") ||
                         d.label.toLowerCase().includes("cable") ||
                         d.label.toLowerCase().includes("virtual"))
                );

                if (virtualInput) {
                    setDeviceId(virtualInput.deviceId);
                    setDeviceLabel(virtualInput.label);
                    setFound(true);
                } else {
                    setDeviceId(undefined);
                    setDeviceLabel(null);
                    setFound(false);
                }
            } catch {
                setDeviceId(undefined);
                setDeviceLabel(null);
                setFound(false);
            }
        };

        checkDevices();

        if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
            navigator.mediaDevices.addEventListener("devicechange", checkDevices);
            return () => {
                navigator.mediaDevices.removeEventListener("devicechange", checkDevices);
            };
        }
    }, []);

    return { deviceId, deviceLabel, found };
}

export default useSystemAudioDevice;
