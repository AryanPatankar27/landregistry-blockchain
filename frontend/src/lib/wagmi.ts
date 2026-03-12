import { http, createConfig } from "wagmi";
import { hardhat, polygonAmoy } from "wagmi/chains";

const chainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "31337");

export const config = createConfig({
    chains: [hardhat, polygonAmoy],
    transports: {
        [hardhat.id]: http(process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8545"),
        [polygonAmoy.id]: http(process.env.NEXT_PUBLIC_RPC_URL),
    },
});
