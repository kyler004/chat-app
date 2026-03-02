import { Router } from "express";
import { register, login, getMe } from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/regular", register);
router.post("/login", login);
router.get("/me", protect, getMe); // Protected Route examples

export default router;
