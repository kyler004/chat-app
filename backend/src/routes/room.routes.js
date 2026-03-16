import {
  getRooms,
  createRoom,
  addMember,
  removeMember,
  getMemberStatus,
  updateRoom
} from "../controllers/room.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { Router } from "express";

const router = Router();

router.get("/", protect, getRooms);
router.post("/", protect, createRoom);
router.put("/:id", protect, updateRoom);


// Member management
router.get("/:roomId/members", protect, getMemberStatus);
router.post("/:roomId/members", protect, addMember);
router.delete("/:roomId/members/:userId", protect, removeMember);

export default router;
