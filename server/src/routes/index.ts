import { Router } from "express";
import authRoutes from "./auth.routes";
import customerRoutes from "./customer.routes";
import healthRoutes from "./health.routes";

const router = Router();

router.use(healthRoutes);
router.use("/auth", authRoutes);
router.use("/customers", customerRoutes);

export default router;
