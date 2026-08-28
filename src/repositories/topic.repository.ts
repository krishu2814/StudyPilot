import { prisma } from "../db/prisma.js";
import { Topic, Prisma } from "@prisma/client";

export class TopicRepository {
  async findBySubjectIdAndName(subjectId: string, name: string): Promise<Topic | null> {
    return prisma.topic.findUnique({
      where: {
        subjectId_name: {
          subjectId,
          name: name.trim(),
        },
      },
    });
  }

  async findById(id: string) {
    return prisma.topic.findUnique({
      where: { id },
      include: { subject: true },
    });
  }

  async findAllBySubjectId(subjectId: string): Promise<Topic[]> {
    return prisma.topic.findMany({
      where: { subjectId },
      orderBy: { name: "asc" },
    });
  }

  async create(data: Prisma.TopicUncheckedCreateInput): Promise<Topic> {
    return prisma.topic.create({
      data: {
        ...data,
        name: data.name.trim(),
        description: data.description ? data.description.trim() : null,
      },
    });
  }

  async delete(id: string): Promise<Topic> {
    return prisma.topic.delete({
      where: { id },
    });
  }
}

export const topicRepository = new TopicRepository();
