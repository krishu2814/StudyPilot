import { QuizAIService } from "../src/services/quizAI.service.js";

describe("QuizAIService (Question Generator & Evaluator)", () => {
  const service = new QuizAIService();

  describe("Question Generation", () => {
    it("should fail if topicName is missing", async () => {
      await expect(service.generateQuestions({ topicName: "" })).rejects.toThrow(
        "Topic name is required for quiz generation."
      );
    });

    it("should generate requested number of questions with options", async () => {
      const questions = await service.generateQuestions({
        topicName: "Deadlock Detection in OS",
        count: 3,
        difficulty: "intermediate",
      });

      expect(questions).toHaveLength(3);
      questions.forEach((q) => {
        expect(q.questionText).toBeDefined();
        expect(q.expectedAnswer).toBeDefined();
        expect(q.difficulty).toBe("intermediate");
        expect(q.options).toHaveLength(4);
      });
    });
  });

  describe("Answer Evaluation", () => {
    it("should evaluate empty answer as unattempted", async () => {
      const result = await service.evaluateAnswer({
        questionText: "What is 3NF?",
        expectedAnswer: "Third Normal Form eliminates transitive dependencies.",
        userAnswer: "",
      });

      expect(result.isCorrect).toBe(false);
      expect(result.score).toBe(0.0);
      expect(result.detectedWeakness).toBe("Unattempted Question");
    });

    it("should award full score for matching answer", async () => {
      const result = await service.evaluateAnswer({
        questionText: "What is BCNF?",
        expectedAnswer: "Boyce-Codd Normal Form",
        userAnswer: "Boyce-Codd Normal Form",
      });

      expect(result.isCorrect).toBe(true);
      expect(result.score).toBe(1.0);
      expect(result.detectedWeakness).toBeNull();
    });

    it("should detect weakness for incorrect answer", async () => {
      const result = await service.evaluateAnswer({
        questionText: "What does ACID stand for?",
        expectedAnswer: "Atomicity, Consistency, Isolation, Durability",
        userAnswer: "Array, Class, Integer, Double",
      });

      expect(result.isCorrect).toBe(false);
      expect(result.score).toBeLessThan(0.5);
      expect(result.detectedWeakness).toBeDefined();
    });
  });
});
