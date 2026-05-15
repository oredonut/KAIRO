export function getNextStepAI(state: {
    skills: string[];
    voiceBio: string | null;
    workSample: string | null;
}) {
    if (!state.voiceBio) return "voice";
    if (!state.workSample) return "work";

    if (state.skills.includes("Freelancer")) {
        return "work";
    }

    return "wallet";
}