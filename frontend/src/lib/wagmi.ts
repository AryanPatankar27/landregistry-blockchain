import { http, createConfig } from "wagmi";
import { hardhat, polygonAmoy, sepolia } from "wagmi/chains";

export const config = createConfig({
    chains: [sepolia, hardhat, polygonAmoy],
    transports: {
        [sepolia.id]: http(process.env.NEXT_PUBLIC_RPC_URL),
        [hardhat.id]: http("http://127.0.0.1:8545"),
        [polygonAmoy.id]: http(),
    },
});
