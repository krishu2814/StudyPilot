import { Router } from "express";
import {
  createConversation,
  getConversations,
  getConversationById,
  updateConversationTitle,
  deleteConversation,
  sendMessage,
} from "../controllers/chat.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

// Protect all chat endpoints
router.use(authenticate);

// Conversation management
router.post("/", createConversation);
router.get("/", getConversations);
router.get("/:id", getConversationById);
router.patch("/:id", updateConversationTitle);
router.delete("/:id", deleteConversation);

// Multi-turn message interaction
router.post("/:id/messages", sendMessage);

export default router;
