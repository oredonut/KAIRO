import { create } from "zustand";

type State = {
    score: number;

    identity: number;
    skills: number;
    engagement: number;
    consistency: number;

    update: (step: string) => void;
};

export const useTrustStore = create<State>()((set, get) => ({
    score: 0,

    identity: 0,
    skills: 0,
    engagement: 0,
    consistency: 0,

    update: (step: string) => {
        const current = get();

        let delta = 0;

        if (step === "identity") {
            delta = 15;
            set({ identity: 80 });
        }

        if (step === "skills") {
            delta = 20;
            set({ skills: 85 });
        }

        if (step === "voice") {
            delta = 15;
            set({ engagement: 70 });
        }

        if (step === "work") {
            delta = 25;
            set({ consistency: 75 });
        }

        if (step === "wallet") {
            delta = 20;
        }

        set({ score: Math.min(100, current.score + delta) });
    },
}));