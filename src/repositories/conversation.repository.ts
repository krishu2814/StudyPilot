import { prisma } from "../db/prisma.js";
import { Conversation, Message, Prisma } from "@prisma/client";

export interface AddMessageInput {
  conversationId: string;
  sender: "user" | "assistant";
  content: string;
  metadata?: Prisma.InputJsonValue;
}

export class ConversationRepository {
  async create(userId: string, title: string = "New Session"): Promise<Conversation> {
    return prisma.conversation.create({
      data: {
        userId,
        title: title.trim() || "New Session",
      },
    });
  }

  async findAllByUserId(userId: string) {
    return prisma.conversation.findMany({
      where: { userId },
      include: {
        _count: {
          select: {
            messages: true,
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
          select: {
            content: true,
            sender: true,
            createdAt: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  async findByIdAndUserId(id: string, userId: string) {
    return prisma.conversation.findFirst({
      where: { id, userId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });
  }

  async addMessage(input: AddMessageInput): Promise<Message> {
    const message = await prisma.message.create({
      data: {
        conversationId: input.conversationId,
        sender: input.sender,
        content: input.content.trim(),
        metadata: input.metadata || Prisma.DbNull,
      },
    });

    await prisma.conversation.update({
      where: { id: input.conversationId },
      data: { updatedAt: new Date() },
    });

    return message;
  }

  async updateTitle(id: string, title: string): Promise<Conversation> {
    return prisma.conversation.update({
      where: { id },
      data: {
        title: title.trim(),
      },
    });
  }

  async delete(id: string): Promise<Conversation> {
    return prisma.conversation.delete({
      where: { id },
    });
  }
}

export const conversationRepository = new ConversationRepository();
