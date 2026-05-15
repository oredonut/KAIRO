import { create } from "zustand";

type State = {
    fullName: string;
    phone: string;
    location: string;
    skills: string[];
    voiceBio: string | null;
    workSample: string | null;
    bvn: string;
    bvnVerified: boolean;
    profileImage: string | null;
    language: 'en' | 'pidgin';
    socialLinks: {
      linkedin?: string;
      instagram?: string;
      x?: string;
    };
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
    bvn: "",
    bvnVerified: false,
    profileImage: null,
    language: 'en',
    socialLinks: {},
    walletCreated: false,

    set: (data: Partial<State>) => set((s: State) => ({ ...s, ...data })),
}));