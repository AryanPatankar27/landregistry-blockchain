import { Router, Response } from "express";
import prisma from "../config/prisma";
import { authenticate, AuthRequest } from "../middleware/auth.middleware";

const router = Router();

// Cache a new transfer request
router.post("/", authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { tokenId, toAddress, txHash } = req.body;

        const transfer = await prisma.transferCache.create({
            data: {
                tokenId: parseInt(tokenId),
                fromAddress: req.user!.walletAddress,
                toAddress: toAddress.toLowerCase(),
                status: "INITIATED",
                txHash,
            },
        });

        // Create notification for buyer
        const buyer = await prisma.user.findUnique({
            where: { walletAddress: toAddress.toLowerCase() },
        });

        if (buyer) {
            await prisma.notification.create({
                data: {
                    userId: buyer.id,
                    title: "Transfer Request",
                    message: `You have a new land transfer request for token #${tokenId}`,
                },
            });
        }

        res.status(201).json({ success: true, transfer });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || "Failed to cache transfer",
        });
    }
});

// Get transfers for a token
router.get(
    "/token/:tokenId",
    async (req: AuthRequest, res: Response) => {
        try {
            const tokenId = parseInt(req.params.tokenId as string);

            const transfers = await prisma.transferCache.findMany({
                where: { tokenId },
                orderBy: { createdAt: "desc" },
            });

            res.json({ success: true, transfers });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Failed to fetch transfers",
            });
        }
    }
);

// Get transfers for current user
router.get(
    "/my",
    authenticate,
    async (req: AuthRequest, res: Response) => {
        try {
            const wallet = req.user!.walletAddress;

            const transfers = await prisma.transferCache.findMany({
                where: {
                    OR: [{ fromAddress: wallet }, { toAddress: wallet }],
                },
                orderBy: { createdAt: "desc" },
            });

            res.json({ success: true, transfers });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Failed to fetch transfers",
            });
        }
    }
);

// Update transfer status
router.patch(
    "/:id/status",
    authenticate,
    async (req: AuthRequest, res: Response) => {
        try {
            const id = req.params.id as string;
            const { status } = req.body;

            const transfer = await prisma.transferCache.update({
                where: { id },
                data: { status },
            });

            res.json({ success: true, transfer });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Failed to update transfer status",
            });
        }
    }
);

export default router;
