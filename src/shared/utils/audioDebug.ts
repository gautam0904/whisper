const PREFIX = "[Whisper Audio]";

let stepCounter = 0;

export function audioLog(phase: string, detail?: Record<string, unknown> | string | number | boolean | null): void {
    stepCounter += 1;
    const label = `${PREFIX} Step ${stepCounter}: ${phase}`;
    if (detail !== undefined) {
        console.log(label, detail);
    } else {
        console.log(label);
    }
}

export function audioLogError(phase: string, error: unknown): void {
    stepCounter += 1;
    console.error(`${PREFIX} Step ${stepCounter} FAILED: ${phase}`, error);
}

export function resetAudioLog(): void {
    stepCounter = 0;
    console.log(`${PREFIX} ——— new session ———`);
}
