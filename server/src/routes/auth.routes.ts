import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import { validateBody } from "../middleware/validate";
import { loginSchema, registerSchema } from "../validators/auth.validators";

const router = Router();

router.post("/login", validateBody(loginSchema), authController.login);
router.post("/register", validateBody(registerSchema), authController.register);

export default router;
