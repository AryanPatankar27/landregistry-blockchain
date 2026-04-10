import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

function updateEnvFile(filePath: string, updates: Record<string, string>) {
    let content = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
    for (const [key, value] of Object.entries(updates)) {
        const regex = new RegExp(`^${key}=.*$`, "m");
        if (regex.test(content)) {
            content = content.replace(regex, `${key}=${value}`);
        } else {
            content += `\n${key}=${value}`;
        }
    }
    fs.writeFileSync(filePath, content);
    console.log(`  Updated: ${filePath}`);
}

async function main() {
    console.log("🚀 Deploying TerraChain LandRegistry...\n");

    const [deployer] = await ethers.getSigners();
    console.log("Deployer address:", deployer.address);
    console.log("Deployer balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

    // Deploy LandRegistry
    const LandRegistry = await ethers.getContractFactory("LandRegistry");
    const landRegistry = await LandRegistry.deploy();
    await landRegistry.waitForDeployment();

    const address = await landRegistry.getAddress();
    console.log("✅ LandRegistry deployed to:", address);

    // Log roles
    const REGISTRAR_ROLE = await landRegistry.REGISTRAR_ROLE();
    const ADMIN_ROLE = await landRegistry.ADMIN_ROLE();
    console.log("\n📋 Roles assigned to deployer:");
    console.log("  ADMIN_ROLE:", ADMIN_ROLE);
    console.log("  REGISTRAR_ROLE:", REGISTRAR_ROLE);

    // Auto-update env files
    const rpcUrl = process.env.SEPOLIA_RPC_URL || "";
    const frontendEnv = path.resolve(__dirname, "../../frontend/.env.local");
    const backendEnv = path.resolve(__dirname, "../../backend/.env");

    console.log("\n📝 Auto-updating .env files...");
    updateEnvFile(frontendEnv, {
        NEXT_PUBLIC_CONTRACT_ADDRESS: address,
        NEXT_PUBLIC_CHAIN_ID: "11155111",
        NEXT_PUBLIC_RPC_URL: rpcUrl,
    });
    updateEnvFile(backendEnv, {
        CONTRACT_ADDRESS: address,
        RPC_URL: rpcUrl,
    });

    console.log("\n🎉 Deployment complete! All .env files updated automatically.");
    console.log(`\nContract address: ${address}`);
    console.log("You can now start the backend and frontend.");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
