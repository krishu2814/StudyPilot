import { subjectRepository, SubjectRepository } from "../repositories/subject.repository.js";
import { topicRepository, TopicRepository } from "../repositories/topic.repository.js";

export class SubjectService {
  constructor(
    private subjectRepo: SubjectRepository = subjectRepository,
    private topicRepo: TopicRepository = topicRepository
  ) {}

  async createSubject(userId: string, name: string, description?: string) {
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      throw new Error("Subject name is required.");
    }

    const existing = await this.subjectRepo.findByUserIdAndName(userId, name);
    if (existing) {
      throw new Error("Subject with this name already exists.");
    }

    return this.subjectRepo.create({
      userId,
      name,
      description,
    });
  }

  async getSubjects(userId: string) {
    return this.subjectRepo.findAllByUserId(userId);
  }

  async getSubjectById(id: string, userId: string) {
    const subject = await this.subjectRepo.findByIdAndUserId(id, userId);
    if (!subject) {
      throw new Error("Subject not found.");
    }
    return subject;
  }

  async deleteSubject(id: string, userId: string) {
    const subject = await this.subjectRepo.findByIdAndUserId(id, userId);
    if (!subject) {
      throw new Error("Subject not found.");
    }
    return this.subjectRepo.delete(id);
  }

  async createTopic(userId: string, subjectId: string, name: string, description?: string) {
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      throw new Error("Topic name is required.");
    }

    const subject = await this.subjectRepo.findByIdAndUserId(subjectId, userId);
    if (!subject) {
      throw new Error("Subject not found.");
    }

    const existingTopic = await this.topicRepo.findBySubjectIdAndName(subjectId, name);
    if (existingTopic) {
      throw new Error("Topic with this name already exists in this subject.");
    }

    return this.topicRepo.create({
      subjectId,
      name,
      description,
    });
  }

  async getTopics(userId: string, subjectId: string) {
    const subject = await this.subjectRepo.findByIdAndUserId(subjectId, userId);
    if (!subject) {
      throw new Error("Subject not found.");
    }
    return this.topicRepo.findAllBySubjectId(subjectId);
  }

  async deleteTopic(id: string, userId: string) {
    const topic = await this.topicRepo.findById(id);
    if (!topic || topic.subject.userId !== userId) {
      throw new Error("Topic not found.");
    }
    return this.topicRepo.delete(id);
  }
}

export const subjectService = new SubjectService();
