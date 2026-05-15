export async function sendBehaviorEvent(event: {
    type: string;
    payload?: any;
}) {
    try {
        await fetch("https://api.kairo.ai/events", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ...event,
                timestamp: Date.now(),
            }),
        });
    } catch (e) {
        console.log("event failed", e);
    }
}