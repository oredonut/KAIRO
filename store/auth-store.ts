import { create } from "zustand";

type AuthState = {
    user: {
        email: string;
        username: string;
        fullName: string;
    } | null;
    token: string | null;
    isAuthenticated: boolean;

    setAuth: (user: AuthState["user"], token: string) => void;
    logout: () => void;
};

export const useAuthStore = create<AuthState>()((set) => ({
    user: null,
    token: null,
    isAuthenticated: false,

    setAuth: (user, token) => set({ user, token, isAuthenticated: true }),
    logout: () => set({ user: null, token: null, isAuthenticated: false }),
}));
