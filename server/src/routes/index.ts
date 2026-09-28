import { Router } from "express";
import { apiLogger } from "../middleware/apiLogger";
import authRoutes from "./auth.routes";
import customerRoutes from "./customer.routes";
import healthRoutes from "./health.routes";
import integrationRoutes from "./integration.routes";
import inventoryRoutes from "./inventory.routes";
import logRoutes from "./log.routes";
import orderRoutes from "./order.routes";
import productRoutes from "./product.routes";

const router = Router();

// Scoped to /api/* only, so Swagger's static assets under /api-docs and the
// unversioned "/" root endpoint never pollute ApiLog with non-API noise.
router.use(apiLogger);

router.use(healthRoutes);
router.use("/auth", authRoutes);
router.use("/customers", customerRoutes);
router.use("/products", productRoutes);
router.use("/inventory", inventoryRoutes);
router.use("/orders", orderRoutes);
router.use("/logs", logRoutes);
router.use("/integration", integrationRoutes);

export default router;
