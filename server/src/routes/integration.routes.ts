import { Router } from "express";
import * as integrationController from "../controllers/priorityIntegration.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.use(authenticate);

router.get("/status", integrationController.getStatus);
router.get("/history", integrationController.getHistory);

router.post("/sync/customers", integrationController.syncCustomers);
router.post("/sync/products", integrationController.syncProducts);
router.post("/sync/inventory", integrationController.syncInventory);
router.post("/sync/orders", integrationController.syncOrders);
router.post("/sync/all", integrationController.syncAll);

export default router;
