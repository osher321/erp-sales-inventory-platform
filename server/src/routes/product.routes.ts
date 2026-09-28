import { Router } from "express";
import * as productController from "../controllers/product.controller";
import { authenticate } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate";
import { createProductSchema, updateProductSchema } from "../validators/product.validators";

const router = Router();

router.use(authenticate);

// Must come before "/:id" so "low-stock"/"out-of-stock" aren't matched as an id.
router.get("/low-stock", productController.lowStock);
router.get("/out-of-stock", productController.outOfStock);

router.get("/", productController.list);
router.get("/:id", productController.getById);
router.post("/", validateBody(createProductSchema), productController.create);
router.put("/:id", validateBody(updateProductSchema), productController.update);
router.delete("/:id", productController.remove);

export default router;
