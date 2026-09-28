import { Router } from "express";
import * as customerController from "../controllers/customer.controller";
import { authenticate } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate";
import { createCustomerSchema, updateCustomerSchema } from "../validators/customer.validators";

const router = Router();

router.use(authenticate);

router.get("/", customerController.list);
router.get("/:id", customerController.getById);
router.post("/", validateBody(createCustomerSchema), customerController.create);
router.put("/:id", validateBody(updateCustomerSchema), customerController.update);
router.delete("/:id", customerController.remove);

export default router;
