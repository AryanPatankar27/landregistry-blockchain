import { Router, Response } from "express";
import prisma from "../config/prisma";
import { authenticate, AuthRequest } from "../middleware/auth.middleware";

const router = Router();

// Owner dashboard
router.get(
    "/owner",
    authenticate,
    async (req: AuthRequest, res: Response) => {
        try {
            const wallet = req.user!.walletAddress;

            const myParcels = await prisma.landParcelCache.findMany({
                where: { owner: wallet },
                orderBy: { createdAt: "desc" },
            });

            const myTransfers = await prisma.transferCache.findMany({
                where: {
                    OR: [{ fromAddress: wallet }, { toAddress: wallet }],
                },
                orderBy: { createdAt: "desc" },
                take: 10,
            });

            res.json({
                success: true,
                data: {
                    totalParcels: myParcels.length,
                    parcels: myParcels,
                    recentTransfers: myTransfers,
                },
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Failed to load owner dashboard",
            });
        }
    }
);

// Registrar dashboard
router.get(
    "/registrar",
    authenticate,
    async (req: AuthRequest, res: Response) => {
        try {
            if (!["REGISTRAR", "ADMIN"].includes(req.user!.role)) {
                return res.status(403).json({
                    success: false,
                    message: "Registrar access required",
                });
            }

            const pendingRegistrations = await prisma.landParcelCache.findMany({
                where: { status: "PENDING" },
                orderBy: { createdAt: "desc" },
            });

            const pendingTransfers = await prisma.transferCache.findMany({
                where: {
                    status: { in: ["INITIATED", "BUYER_ACCEPTED"] },
                },
                orderBy: { createdAt: "desc" },
            });

            const pendingDisputes = await prisma.disputeCache.findMany({
                where: { resolved: false },
                orderBy: { createdAt: "desc" },
            });

            res.json({
                success: true,
                data: {
                    pendingRegistrations,
                    pendingTransfers,
                    pendingDisputes,
                    stats: {
                        registrations: pendingRegistrations.length,
                        transfers: pendingTransfers.length,
                        disputes: pendingDisputes.length,
                    },
                },
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Failed to load registrar dashboard",
            });
        }
    }
);

// Admin analytics
router.get(
    "/admin",
    authenticate,
    async (req: AuthRequest, res: Response) => {
        try {
            if (req.user!.role !== "ADMIN") {
                return res.status(403).json({
                    success: false,
                    message: "Admin access required",
                });
            }

            const totalParcels = await prisma.landParcelCache.count();
            const totalTransfers = await prisma.transferCache.count();
            const totalUsers = await prisma.user.count();
            const totalDisputes = await prisma.disputeCache.count();

            const parcelsByStatus = await prisma.landParcelCache.groupBy({
                by: ["status"],
                _count: { status: true },
            });

            res.json({
                success: true,
                data: {
                    totalParcels,
                    totalTransfers,
                    totalUsers,
                    totalDisputes,
                    parcelsByStatus,
                },
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Failed to load admin analytics",
            });
        }
    }
);

export default router;
