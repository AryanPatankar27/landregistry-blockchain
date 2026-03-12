"use client";

import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { config } from "@/lib/wagmi";
import { Toaster } from "react-hot-toast";

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                {children}
                <Toaster
                    position="bottom-right"
                    toastOptions={{
                        style: {
                            background: "#1a1a2e",
                            color: "#e2e8f0",
                            border: "1px solid #2a2a4a",
                            borderRadius: "12px",
                            fontSize: "0.9rem",
                        },
                    }}
                />
            </QueryClientProvider>
        </WagmiProvider>
    );
}
