import { Router } from "express";
import { searchSemantic } from "../controllers/search.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

// Protect all search endpoints
router.use(authenticate);

// Semantic vector similarity search
router.post("/semantic", searchSemantic);

export default router;
