import { Router } from "express";
import authRoutes from "./auth.routes";
import customerRoutes from "./customer.routes";
import healthRoutes from "./health.routes";
import inventoryRoutes from "./inventory.routes";
import productRoutes from "./product.routes";

const router = Router();

router.use(healthRoutes);
router.use("/auth", authRoutes);
router.use("/customers", customerRoutes);
router.use("/products", productRoutes);
router.use("/inventory", inventoryRoutes);

export default router;
