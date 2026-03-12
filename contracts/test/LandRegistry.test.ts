import { expect } from "chai";
import { ethers } from "hardhat";
import { LandRegistry } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("LandRegistry", function () {
    let landRegistry: LandRegistry;
    let owner: SignerWithAddress;
    let registrar: SignerWithAddress;
    let user1: SignerWithAddress;
    let user2: SignerWithAddress;

    beforeEach(async function () {
        [owner, registrar, user1, user2] = await ethers.getSigners();

        const LandRegistryFactory = await ethers.getContractFactory("LandRegistry");
        landRegistry = await LandRegistryFactory.deploy();

        // Add registrar
        await landRegistry.addRegistrar(registrar.address);
    });

    describe("Registration", function () {
        it("Should register new land", async function () {
            await expect(
                landRegistry.connect(user1).registerLand("SRV-1", "Pune", 500, "QmHash1")
            )
                .to.emit(landRegistry, "LandRegistered")
                .withArgs(1, user1.address, "SRV-1", "Pune", 500);

            const parcel = await landRegistry.getLandDetails(1);
            expect(parcel.owner).to.equal(user1.address);
            expect(parcel.status).to.equal(0); // Pending
        });

        it("Only registrar can approve land", async function () {
            await landRegistry.connect(user1).registerLand("SRV-1", "Pune", 500, "QmHash1");

            await expect(
                landRegistry.connect(user1).approveLand(1)
            ).to.be.revertedWithCustomError(landRegistry, "AccessControlUnauthorizedAccount");

            await expect(landRegistry.connect(registrar).approveLand(1))
                .to.emit(landRegistry, "LandApproved")
                .withArgs(1, registrar.address);

            const parcel = await landRegistry.getLandDetails(1);
            expect(parcel.status).to.equal(1); // Approved
        });
    });

    describe("Transfers", function () {
        beforeEach(async function () {
            await landRegistry.connect(user1).registerLand("SRV-1", "Pune", 500, "QmHash1");
            await landRegistry.connect(registrar).approveLand(1);
        });

        it("Should initiate transfer", async function () {
            await expect(landRegistry.connect(user1).initiateTransfer(1, user2.address))
                .to.emit(landRegistry, "TransferInitiated")
                .withArgs(1, user1.address, user2.address);

            const transfer = await landRegistry.getTransferDetails(1);
            expect(transfer.to).to.equal(user2.address);
            expect(transfer.status).to.equal(1); // Initiated
        });

        it("Should complete transfer after accept and approve", async function () {
            await landRegistry.connect(user1).initiateTransfer(1, user2.address);
            await landRegistry.connect(user2).acceptTransfer(1);

            await expect(landRegistry.connect(registrar).approveTransfer(1))
                .to.emit(landRegistry, "TransferApproved")
                .withArgs(1, registrar.address);

            expect(await landRegistry.ownerOf(1)).to.equal(user2.address);
        });
    });

    describe("Disputes", function () {
        beforeEach(async function () {
            await landRegistry.connect(user1).registerLand("SRV-1", "Pune", 500, "QmHash1");
            await landRegistry.connect(registrar).approveLand(1);
        });

        it("Should raise dispute and freeze parcel", async function () {
            await expect(landRegistry.connect(user2).raiseDispute(1, "QmEvidence"))
                .to.emit(landRegistry, "DisputeRaised")
                .withArgs(1, user2.address, "QmEvidence");

            const parcel = await landRegistry.getLandDetails(1);
            expect(parcel.status).to.equal(3); // Under Dispute

            // Prevent transfer initiation while disputed
            await expect(
                landRegistry.connect(user1).initiateTransfer(1, user2.address)
            ).to.be.revertedWith("Not approved");
        });

        it("Should resolve dispute", async function () {
            await landRegistry.connect(user2).raiseDispute(1, "QmEvidence");

            await expect(landRegistry.connect(registrar).resolveDispute(1, false)) // false = cleared / resolve dispute
                .to.emit(landRegistry, "DisputeResolved")
                .withArgs(1, false, registrar.address);

            const parcel = await landRegistry.getLandDetails(1);
            expect(parcel.status).to.equal(1); // Approved again
        });
    });
});
