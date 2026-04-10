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

function loadFromStorage<T>(key: string, parse = false): T | null {
    if (typeof window === "undefined") return null;
    try {
        const val = localStorage.getItem(key);
        if (!val) return null;
        return parse ? JSON.parse(val) : (val as unknown as T);
    } catch {
        return null;
    }
}

export const useAppStore = create<AppState>((set) => ({
    user: loadFromStorage<User>("terrachain_user", true),
    token: loadFromStorage<string>("terrachain_token"),
    isConnected: false,
    setUser: (user) => {
        if (user) {
            localStorage.setItem("terrachain_user", JSON.stringify(user));
        } else {
            localStorage.removeItem("terrachain_user");
        }
        set({ user });
    },
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
        localStorage.removeItem("terrachain_user");
        set({ user: null, token: null, isConnected: false });
    },
}));
