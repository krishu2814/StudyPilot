import { Router } from "express";
import {
  uploadDocument,
  getDocuments,
  getDocumentById,
  deleteDocument,
} from "../controllers/document.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";

const router = Router();

// Protect all document endpoints
router.use(authenticate);

// Document upload
router.post("/upload", upload.single("file"), uploadDocument);

// Document listing and retrieval
router.get("/", getDocuments);
router.get("/:id", getDocumentById);

// Document deletion
router.delete("/:id", deleteDocument);

export default router;
