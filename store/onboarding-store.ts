import { create } from "zustand";

type State = {
    fullName: string;
    phone: string;
    location: string;
    skills: string[];
    voiceBio: string | null;
    workSample: string | null;
    walletCreated: boolean;

    set: (data: Partial<State>) => void;
};

export const useOnboardingStore = create<State>()((set) => ({
    fullName: "",
    phone: "",
    location: "",
    skills: [],
    voiceBio: null,
    workSample: null,
    walletCreated: false,

    set: (data: Partial<State>) => set((s: State) => ({ ...s, ...data })),
}));