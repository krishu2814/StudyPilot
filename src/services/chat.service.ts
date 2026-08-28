import { conversationRepository, ConversationRepository } from "../repositories/conversation.repository.js";
import { searchService, SearchService } from "./search.service.js";
import { aiService, AIService } from "./ai.service.js";

export interface SendMessageParams {
  userId: string;
  conversationId: string;
  content: string;
  subjectId?: string;
  topicId?: string;
}

export class ChatService {
  constructor(
    private conversationRepo: ConversationRepository = conversationRepository,
    private searchSvc: SearchService = searchService,
    private aiSvc: AIService = aiService
  ) {}

  async createConversation(userId: string, title?: string) {
    return this.conversationRepo.create(userId, title);
  }

  async getConversations(userId: string) {
    return this.conversationRepo.findAllByUserId(userId);
  }

  async getConversationById(id: string, userId: string) {
    const conversation = await this.conversationRepo.findByIdAndUserId(id, userId);
    if (!conversation) {
      throw new Error("Conversation not found.");
    }
    return conversation;
  }

  async updateTitle(id: string, userId: string, title: string) {
    const conversation = await this.conversationRepo.findByIdAndUserId(id, userId);
    if (!conversation) {
      throw new Error("Conversation not found.");
    }
    if (!title || title.trim().length === 0) {
      throw new Error("Title cannot be empty.");
    }
    return this.conversationRepo.updateTitle(id, title);
  }

  async deleteConversation(id: string, userId: string) {
    const conversation = await this.conversationRepo.findByIdAndUserId(id, userId);
    if (!conversation) {
      throw new Error("Conversation not found.");
    }
    return this.conversationRepo.delete(id);
  }

  async sendMessage(params: SendMessageParams) {
    const { userId, conversationId, content, subjectId, topicId } = params;

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      throw new Error("Message content cannot be empty.");
    }

    // 1. Verify conversation ownership
    const conversation = await this.conversationRepo.findByIdAndUserId(conversationId, userId);
    if (!conversation) {
      throw new Error("Conversation not found.");
    }

    const trimmedContent = content.trim();

    // 2. Persist user message
    const userMessage = await this.conversationRepo.addMessage({
      conversationId,
      sender: "user",
      content: trimmedContent,
    });

    // 3. Auto-update title if it's the first message and has default title
    if (conversation.title === "New Session" && conversation.messages.length === 0) {
      const generatedTitle =
        trimmedContent.length > 40
          ? trimmedContent.slice(0, 37) + "..."
          : trimmedContent;
      await this.conversationRepo.updateTitle(conversationId, generatedTitle);
    }

    // 4. Retrieve RAG context chunks from pgvector
    let contextChunks: { content: string; documentTitle?: string }[] = [];
    try {
      const searchResults = await this.searchSvc.semanticSearch({
        userId,
        query: trimmedContent,
        subjectId,
        topicId,
        limit: 3,
        minSimilarity: 0.3,
      });

      contextChunks = searchResults.results.map((r) => ({
        content: r.content,
        documentTitle: r.documentTitle,
      }));
    } catch (err) {
      console.warn("RAG retrieval failed or found no chunks, continuing with base knowledge:", err);
    }

    // 5. Prepare conversation history
    const history = conversation.messages.slice(-6).map((m) => ({
      sender: m.sender,
      content: m.content,
    }));

    // 6. Generate Socratic AI Tutor response
    const tutorResponse = await this.aiSvc.generateTutorResponse({
      question: trimmedContent,
      history,
      contextChunks,
    });

    // 7. Persist assistant message with citations metadata
    const assistantMessage = await this.conversationRepo.addMessage({
      conversationId,
      sender: "assistant",
      content: tutorResponse.reply,
      metadata: {
        sources: tutorResponse.usedSources,
        retrievedContextCount: contextChunks.length,
      },
    });

    return {
      userMessage,
      assistantMessage,
      sources: tutorResponse.usedSources,
    };
  }
}

export const chatService = new ChatService();
