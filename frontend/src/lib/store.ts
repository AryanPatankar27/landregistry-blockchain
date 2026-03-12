import { create } from "zustand";

interface User {
    id: string;
    walletAddress: string;
    role: string;
    displayName?: string;
}

interface AppState {
    user: User | null;
    token: string | null;
    isConnected: boolean;
    setUser: (user: User | null) => void;
    setToken: (token: string | null) => void;
    setConnected: (connected: boolean) => void;
    logout: () => void;
}

export const useAppStore = create<AppState>((set) => ({
    user: null,
    token: null,
    isConnected: false,
    setUser: (user) => set({ user }),
    setToken: (token) => {
        if (token) {
            localStorage.setItem("terrachain_token", token);
        } else {
            localStorage.removeItem("terrachain_token");
        }
        set({ token });
    },
    setConnected: (isConnected) => set({ isConnected }),
    logout: () => {
        localStorage.removeItem("terrachain_token");
        set({ user: null, token: null, isConnected: false });
    },
}));
