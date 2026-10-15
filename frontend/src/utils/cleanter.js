export const CLEANTER_URL = "http://localhost:9100";
export const PAPER_WIDTH = 68; // 80mm roll; lower = bigger side gaps

// Throws an Error with a readable message if Cleanter or the printer is not ready
export async function checkCleanterReady() {
    let res;
    try {
        res = await fetch(`${CLEANTER_URL}/health`, { cache: "no-store" });
    } catch {
        throw new Error(
            "Cannot connect to Cleanter. Make sure it is running and Chrome allows local network access.",
        );
    }
    if (!res.ok) {
        throw new Error(`Cleanter health check failed (status ${res.status}).`);
    }
    const health = await res.json().catch(() => null);
    if (!health || health.status !== "ok" || !health.printer?.connected) {
        throw new Error("Printer is not ready.");
    }
    return health;
}

// Sends a list of print blocks (text, row, divider, feed...) to Cleanter
export async function printViaCleanter(content, { cut = true } = {}) {
    const res = await fetch(`${CLEANTER_URL}/print`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paperWidth: PAPER_WIDTH, cut, content }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
            err?.detail || err?.error || `Print failed with status ${res.status}`,
        );
    }
    return res.json().catch(() => ({}));
}

export function isMobileDevice() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}