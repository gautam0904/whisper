import { useEffect, useState } from "react";

export interface SystemAudioDeviceInfo {
    deviceId: string | undefined;
    deviceLabel: string | null;
    found: boolean;
    isDefault: boolean;
}

function isVirtualDevice(label: string): boolean {
    const l = label.toLowerCase();
    return (
        l.includes("blackhole") ||
        l.includes("vb-audio") ||
        l.includes("cable") ||
        l.includes("virtual")
    );
}

export function useSystemAudioDevice(): SystemAudioDeviceInfo {
    const [deviceId, setDeviceId] = useState<string | undefined>(undefined);
    const [deviceLabel, setDeviceLabel] = useState<string | null>(null);
    const [found, setFound] = useState<boolean>(false);
    const [isDefault, setIsDefault] = useState<boolean>(false);

    useEffect(() => {
        const checkDevices = async () => {
            if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
                return;
            }
            try {
                // Need a live stream first so browser reveals device labels
                let tempStream: MediaStream | null = null;
                try {
                    tempStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                } catch {
                    // Permission not yet granted — labels will be empty strings
                }

                const devices = await navigator.mediaDevices.enumerateDevices();
                const audioInputs = devices.filter((d) => d.kind === "audioinput");

                const virtualInput = audioInputs.find(
                    (d) => d.label && isVirtualDevice(d.label)
                );

                if (tempStream) {
                    tempStream.getTracks().forEach((t) => t.stop());
                }

                if (virtualInput) {
                    setDeviceId(virtualInput.deviceId);
                    setDeviceLabel(virtualInput.label);
                    setFound(true);

                    // Check if the virtual device is the current system default.
                    // The default device always appears with deviceId === "default"
                    // in Chrome/WebView2, or the default device's actual id is the
                    // first entry in the list with groupId matching the virtual device.
                    // Most reliable: open a default stream and check the track label.
                    try {
                        const defaultStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                        const defaultLabel = defaultStream.getAudioTracks()[0]?.label ?? "";
                        defaultStream.getTracks().forEach((t) => t.stop());
                        setIsDefault(isVirtualDevice(defaultLabel));
                    } catch {
                        setIsDefault(false);
                    }
                } else {
                    setDeviceId(undefined);
                    setDeviceLabel(null);
                    setFound(false);
                    setIsDefault(false);
                }
            } catch {
                setDeviceId(undefined);
                setDeviceLabel(null);
                setFound(false);
                setIsDefault(false);
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

    return { deviceId, deviceLabel, found, isDefault };
}

export default useSystemAudioDevice;
