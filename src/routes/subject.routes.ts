import { Router } from "express";
import {
  createSubject,
  getSubjects,
  getSubjectById,
  deleteSubject,
  createTopic,
  getTopics,
  deleteTopic,
} from "../controllers/subject.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

// Protect all subject & topic routes
router.use(authenticate);

// Subject CRUD
router.post("/", createSubject);
router.get("/", getSubjects);
router.get("/:id", getSubjectById);
router.delete("/:id", deleteSubject);

// Topic management under subject
router.post("/:subjectId/topics", createTopic);
router.get("/:subjectId/topics", getTopics);

// Direct topic deletion
router.delete("/topics/:id", deleteTopic);

export default router;
