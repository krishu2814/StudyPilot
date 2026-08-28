import { prisma } from "../db/prisma.js";
import { Subject, Prisma } from "@prisma/client";

export class SubjectRepository {
  async findByUserIdAndName(userId: string, name: string): Promise<Subject | null> {
    return prisma.subject.findUnique({
      where: {
        userId_name: {
          userId,
          name: name.trim(),
        },
      },
    });
  }

  async findByIdAndUserId(id: string, userId: string) {
    return prisma.subject.findFirst({
      where: { id, userId },
      include: {
        topics: {
          orderBy: { name: "asc" },
        },
        documents: {
          select: {
            id: true,
            title: true,
            fileType: true,
            fileSize: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });
  }

  async findAllByUserId(userId: string) {
    return prisma.subject.findMany({
      where: { userId },
      include: {
        _count: {
          select: {
            topics: true,
            documents: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async create(data: Prisma.SubjectUncheckedCreateInput): Promise<Subject> {
    return prisma.subject.create({
      data: {
        ...data,
        name: data.name.trim(),
        description: data.description ? data.description.trim() : null,
      },
    });
  }

  async delete(id: string): Promise<Subject> {
    return prisma.subject.delete({
      where: { id },
    });
  }
}

export const subjectRepository = new SubjectRepository();
