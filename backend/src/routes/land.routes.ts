import { Router, Request, Response } from "express";
import prisma from "../config/prisma";
import { authenticate, AuthRequest } from "../middleware/auth.middleware";

const router = Router();

// Register / cache a new land parcel (called after on-chain registration)
router.post(
    "/register",
    authenticate,
    async (req: AuthRequest, res: Response) => {
        try {
            const {
                tokenId,
                surveyNumber,
                location,
                latitude,
                longitude,
                area,
                documentsCID,
                txHash,
            } = req.body;

            const parcel = await prisma.landParcelCache.create({
                data: {
                    tokenId: parseInt(tokenId),
                    surveyNumber,
                    location,
                    latitude: latitude ? parseFloat(latitude) : null,
                    longitude: longitude ? parseFloat(longitude) : null,
                    area: parseFloat(area),
                    documentsCID,
                    owner: req.user!.walletAddress,
                    status: "PENDING",
                    txHash,
                },
            });

            res.status(201).json({ success: true, parcel });
        } catch (error: any) {
            console.error("Land registration cache error:", error);
            res.status(500).json({
                success: false,
                message: error.message || "Failed to cache land registration",
            });
        }
    }
);

// Get land parcel by tokenId
router.get("/:tokenId", async (req: Request, res: Response) => {
    try {
        const tokenId = parseInt(req.params.tokenId as string);

        const parcel = await prisma.landParcelCache.findUnique({
            where: { tokenId },
        });

        if (!parcel) {
            return res.status(404).json({
                success: false,
                message: "Land parcel not found",
            });
        }

        res.json({ success: true, parcel });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch land details",
        });
    }
});

// Search land parcels
router.get("/", async (req: Request, res: Response) => {
    try {
        const { surveyNumber, owner, location, status, query } = req.query;

        const where: any = {};

        if (query) {
            const q = (query as string).trim();
            // If it looks like a wallet address, search by owner
            if (/^0x[0-9a-fA-F]{20,}$/.test(q)) {
                where.owner = q.toLowerCase();
            } else {
                // Search surveyNumber OR location
                where.OR = [
                    { surveyNumber: { contains: q } },
                    { location: { contains: q } },
                ];
            }
        } else {
            if (surveyNumber) where.surveyNumber = { contains: surveyNumber as string };
            if (owner) where.owner = (owner as string).toLowerCase();
            if (location) where.location = { contains: location as string };
        }

        if (status) where.status = status as string;

        const parcels = await prisma.landParcelCache.findMany({
            where,
            orderBy: { createdAt: "desc" },
        });

        res.json({ success: true, parcels });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to search parcels",
        });
    }
});

// Update parcel status (used by frontend after on-chain actions)
router.patch(
    "/:tokenId/status",
    authenticate,
    async (req: AuthRequest, res: Response) => {
        try {
            const tokenId = parseInt(req.params.tokenId as string);
            const { status, owner, newTokenId } = req.body;

            const updateData: any = {};
            if (status) updateData.status = status;
            if (owner) updateData.owner = owner.toLowerCase();
            // Allow correcting a tokenId=0 record with the real on-chain tokenId
            if (newTokenId !== undefined && parseInt(newTokenId) > 0) {
                updateData.tokenId = parseInt(newTokenId);
            }

            const parcel = await prisma.landParcelCache.update({
                where: { tokenId },
                data: updateData,
            });

            res.json({ success: true, parcel });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Failed to update parcel status",
            });
        }
    }
);

export default router;
