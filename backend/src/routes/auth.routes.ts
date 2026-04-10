import { Router, Request, Response } from "express";
import { generateNonce, SiweMessage } from "siwe";
import jwt from "jsonwebtoken";
import { ethers } from "ethers";
import { config } from "../config";
import prisma from "../config/prisma";
import { authenticate, AuthRequest } from "../middleware/auth.middleware";

const ROLE_CHECK_ABI = [
    "function hasRole(bytes32 role, address account) view returns (bool)"
];
const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));
const REGISTRAR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("REGISTRAR_ROLE"));

async function getOnChainRole(wallet: string): Promise<string | null> {
    try {
        if (!config.contractAddress || !config.rpcUrl) return null;
        const provider = new ethers.JsonRpcProvider(config.rpcUrl);
        const contract = new ethers.Contract(config.contractAddress, ROLE_CHECK_ABI, provider);
        if (await contract.hasRole(ADMIN_ROLE, wallet)) return "ADMIN";
        if (await contract.hasRole(REGISTRAR_ROLE, wallet)) return "REGISTRAR";
    } catch (e) {
        console.warn("On-chain role check skipped:", (e as any)?.message?.slice(0, 80));
    }
    return null;
}

const router = Router();

// Generate nonce for SIWE
router.get("/nonce", (_req: Request, res: Response) => {
    const nonce = generateNonce();
    res.json({ success: true, nonce });
});

// Verify signed message & issue JWT
router.post("/verify", async (req: Request, res: Response) => {
    try {
        const { message, signature } = req.body;

        if (!message || !signature) {
            return res.status(400).json({
                success: false,
                message: "Message and signature required",
            });
        }

        const siweMessage = new SiweMessage(message);
        const { data: fields } = await siweMessage.verify({ signature });

        const walletAddress = fields.address.toLowerCase();

        // Find or create user
        let user = await prisma.user.findUnique({
            where: { walletAddress },
        });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    walletAddress,
                    nonce: fields.nonce,
                    role: "OWNER",
                },
            });
        } else {
            await prisma.user.update({
                where: { walletAddress },
                data: { nonce: fields.nonce },
            });
        }

        // Sync on-chain role (ADMIN/REGISTRAR) — overrides DB role if on-chain is higher
        const onChainRole = await getOnChainRole(walletAddress);
        if (onChainRole && user.role !== onChainRole) {
            user = await prisma.user.update({
                where: { walletAddress },
                data: { role: onChainRole },
            });
            console.log(`Role synced for ${walletAddress}: ${onChainRole}`);
        }

        // Issue JWT
        const token = jwt.sign(
            {
                id: user.id,
                walletAddress: user.walletAddress,
                role: user.role,
            },
            config.jwtSecret,
            { expiresIn: config.jwtExpiresIn as any }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                walletAddress: user.walletAddress,
                role: user.role,
                displayName: user.displayName,
            },
        });
    } catch (error: any) {
        console.error("SIWE verification error:", error);
        res.status(400).json({
            success: false,
            message: "Signature verification failed",
        });
    }
});

// Get current user profile
router.get("/me", authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user!.id },
        });

        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch profile",
        });
    }
});

// Update profile
router.patch(
    "/profile",
    authenticate,
    async (req: AuthRequest, res: Response) => {
        try {
            const { displayName, email } = req.body;

            const user = await prisma.user.update({
                where: { id: req.user!.id },
                data: { displayName, email },
            });

            res.json({ success: true, user });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Failed to update profile",
            });
        }
    }
);

// Update user role (admin only)
router.patch(
    "/role/:walletAddress",
    authenticate,
    async (req: AuthRequest, res: Response) => {
        try {
            if (req.user!.role !== "ADMIN") {
                return res.status(403).json({
                    success: false,
                    message: "Admin access required",
                });
            }

            const walletAddr = req.params.walletAddress as string;
            const { role } = req.body;

            if (!["OWNER", "BUYER", "REGISTRAR", "ADMIN"].includes(role)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid role",
                });
            }

            const user = await prisma.user.update({
                where: { walletAddress: walletAddr.toLowerCase() },
                data: { role },
            });

            res.json({ success: true, user });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Failed to update role",
            });
        }
    }
);

export default router;
