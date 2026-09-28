import { Router } from "express";
import * as orderController from "../controllers/order.controller";
import { authenticate } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate";
import { createOrderSchema, updateOrderStatusSchema } from "../validators/order.validators";

const router = Router();

router.use(authenticate);

router.get("/", orderController.list);
router.get("/:id", orderController.getById);
router.post("/", validateBody(createOrderSchema), orderController.create);
router.put("/:id/status", validateBody(updateOrderStatusSchema), orderController.updateStatus);

export default router;
