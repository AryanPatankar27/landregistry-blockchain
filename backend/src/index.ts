import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { config } from "./config";
import authRoutes from "./routes/auth.routes";
import landRoutes from "./routes/land.routes";
import transferRoutes from "./routes/transfer.routes";
import disputeRoutes from "./routes/dispute.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import notificationRoutes from "./routes/notification.routes";

const app = express();

// ─── Middleware ───
app.use(helmet());
app.use(
    cors({
        origin: config.frontendUrl,
        credentials: true,
    })
);
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Health Check ───
app.get("/api/health", (_req, res) => {
    res.json({
        status: "ok",
        service: "TerraChain API",
        timestamp: new Date().toISOString(),
    });
});

// ─── Routes ───
app.use("/api/auth", authRoutes);
app.use("/api/land", landRoutes);
app.use("/api/transfer", transferRoutes);
app.use("/api/disputes", disputeRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/notifications", notificationRoutes);

// ─── Error Handler ───
app.use(
    (
        err: any,
        _req: express.Request,
        res: express.Response,
        _next: express.NextFunction
    ) => {
        console.error("❌ Error:", err.message);
        res.status(err.status || 500).json({
            success: false,
            message: err.message || "Internal Server Error",
        });
    }
);

// ─── Start ───
app.listen(config.port, () => {
    console.log(`\n🚀 TerraChain API running on http://localhost:${config.port}`);
    console.log(`📋 Health check: http://localhost:${config.port}/api/health\n`);
});

export default app;
