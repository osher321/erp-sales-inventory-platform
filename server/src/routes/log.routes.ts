import { Router } from "express";
import * as logController from "../controllers/log.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.use(authenticate);

router.get("/", logController.list);

export default router;
