import { Router, Response } from "express";
import prisma from "../config/prisma";
import { authenticate, AuthRequest } from "../middleware/auth.middleware";

const router = Router();

// Get user notifications
router.get("/", authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const notifications = await prisma.notification.findMany({
            where: { userId: req.user!.id },
            orderBy: { createdAt: "desc" },
            take: 50,
        });

        const unreadCount = await prisma.notification.count({
            where: { userId: req.user!.id, read: false },
        });

        res.json({ success: true, notifications, unreadCount });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch notifications",
        });
    }
});

// Mark notification as read
router.patch(
    "/:id/read",
    authenticate,
    async (req: AuthRequest, res: Response) => {
        try {
            const notification = await prisma.notification.update({
                where: { id: req.params.id as string },
                data: { read: true },
            });

            res.json({ success: true, notification });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Failed to update notification",
            });
        }
    }
);

// Mark all as read
router.patch(
    "/read-all",
    authenticate,
    async (req: AuthRequest, res: Response) => {
        try {
            await prisma.notification.updateMany({
                where: { userId: req.user!.id, read: false },
                data: { read: true },
            });

            res.json({ success: true, message: "All notifications marked as read" });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Failed to update notifications",
            });
        }
    }
);

export default router;
