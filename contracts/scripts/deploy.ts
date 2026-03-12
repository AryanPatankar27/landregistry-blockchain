import { ethers } from "hardhat";

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

    console.log("\n🎉 Deployment complete!");
    console.log("\nAdd this to your .env files:");
    console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS=${address}`);
    console.log(`CONTRACT_ADDRESS=${address}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
