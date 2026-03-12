import { Router, Response } from "express";
import prisma from "../config/prisma";
import { authenticate, AuthRequest } from "../middleware/auth.middleware";

const router = Router();

// Submit a dispute
router.post("/", authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { tokenId, evidenceCID } = req.body;

        const dispute = await prisma.disputeCache.create({
            data: {
                tokenId: parseInt(tokenId),
                reporter: req.user!.walletAddress,
                evidenceCID,
            },
        });

        // Update parcel status
        await prisma.landParcelCache.update({
            where: { tokenId: parseInt(tokenId) },
            data: { status: "UNDER_DISPUTE" },
        });

        res.status(201).json({ success: true, dispute });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || "Failed to submit dispute",
        });
    }
});

// Get disputes for a token
router.get("/token/:tokenId", async (req: AuthRequest, res: Response) => {
    try {
        const tokenId = parseInt(req.params.tokenId as string);

        const disputes = await prisma.disputeCache.findMany({
            where: { tokenId },
            orderBy: { createdAt: "desc" },
        });

        res.json({ success: true, disputes });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch disputes",
        });
    }
});

// Get all pending disputes (registrar)
router.get(
    "/pending",
    authenticate,
    async (req: AuthRequest, res: Response) => {
        try {
            const disputes = await prisma.disputeCache.findMany({
                where: { resolved: false },
                orderBy: { createdAt: "desc" },
            });

            res.json({ success: true, disputes });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Failed to fetch pending disputes",
            });
        }
    }
);

// Resolve a dispute
router.patch(
    "/:id/resolve",
    authenticate,
    async (req: AuthRequest, res: Response) => {
        try {
            if (!["REGISTRAR", "ADMIN"].includes(req.user!.role)) {
                return res.status(403).json({
                    success: false,
                    message: "Registrar access required",
                });
            }

            const id = req.params.id as string;
            const { resolved } = req.body;

            const dispute = await prisma.disputeCache.update({
                where: { id },
                data: { resolved: true },
            });

            if (!resolved) {
                await prisma.landParcelCache.update({
                    where: { tokenId: dispute.tokenId },
                    data: { status: "APPROVED" },
                });
            }

            res.json({ success: true, dispute });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Failed to resolve dispute",
            });
        }
    }
);

export default router;
