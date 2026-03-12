import dotenv from "dotenv";
dotenv.config();

export const config = {
    port: parseInt(process.env.PORT || "5000"),
    jwtSecret: process.env.JWT_SECRET || "terrachain-secret",
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
    contractAddress: process.env.CONTRACT_ADDRESS || "",
    rpcUrl: process.env.RPC_URL || "http://127.0.0.1:8545",
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
    databaseUrl: process.env.DATABASE_URL || "file:./dev.db",
};
