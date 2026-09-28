import { Router } from "express";
import * as inventoryController from "../controllers/inventory.controller";
import { authenticate } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate";
import { updateInventorySchema } from "../validators/inventory.validators";

const router = Router();

router.use(authenticate);

// Must come before "/:productId" so "low-stock"/"out-of-stock" aren't matched as an id.
router.get("/low-stock", inventoryController.lowStock);
router.get("/out-of-stock", inventoryController.outOfStock);

router.get("/", inventoryController.list);
router.get("/:productId", inventoryController.getByProductId);
router.put("/:productId", validateBody(updateInventorySchema), inventoryController.update);

export default router;
