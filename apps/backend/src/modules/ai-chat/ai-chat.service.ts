import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'
import { askDeepSeek, askDeepSeekStream } from '@jd-match/ai'

export interface SSEChunk {
    type: 'content' | 'done' | 'error'
    content?: string
    conversationId?: string
    messageId?: string
    error?: string
}

@Injectable()
export class AiChatService {
    constructor(private prisma: PrismaService) {}

    /**
     * Normal chat (non-streaming)
     */
    async chat(userId: string, message: string, conversationId?: string) {
        let conversation = conversationId
            ? await this.prisma.aiChatConversation.findFirst({
                  where: { id: conversationId, userId },
              })
            : null

        if (!conversation) {
            conversation = await this.prisma.aiChatConversation.create({
                data: {
                    title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
                    userId,
                },
            })
        }

        // Save user message
        await this.prisma.aiChatMessage.create({
            data: {
                content: message,
                role: 'USER',
                conversationId: conversation.id,
            },
        })

        // Build context from recent messages
        const historyMessages = await this.prisma.aiChatMessage.findMany({
            where: { conversationId: conversation.id },
            orderBy: { createdAt: 'asc' },
            take: 20,
        })

        const contextPrompt = this.buildContextPrompt(historyMessages, message)

        // Call AI
        const answer = await askDeepSeek(contextPrompt)

        // Save AI response
        const aiMessage = await this.prisma.aiChatMessage.create({
            data: {
                content: answer,
                role: 'ASSISTANT',
                conversationId: conversation.id,
            },
        })

        // Update conversation title
        if (!conversation.title || conversation.title.length < 3) {
            await this.prisma.aiChatConversation.update({
                where: { id: conversation.id },
                data: { title: `AI Chat - ${new Date().toLocaleDateString('zh-CN')}` },
            })
        }

        return {
            code: 0,
            message: 'Chat completed',
            result: {
                conversationId: conversation.id,
                messageId: aiMessage.id,
                answer,
            },
        }
    }

    /**
     * Streaming chat (SSE)
     */
    async *chatStream(
        userId: string,
        message: string,
        conversationId?: string,
    ): AsyncGenerator<SSEChunk, void, unknown> {
        try {
            let conversation = conversationId
                ? await this.prisma.aiChatConversation.findFirst({
                      where: { id: conversationId, userId },
                  })
                : null

            if (!conversation) {
                conversation = await this.prisma.aiChatConversation.create({
                    data: {
                        title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
                        userId,
                    },
                })
            }

            // Save user message
            await this.prisma.aiChatMessage.create({
                data: {
                    content: message,
                    role: 'USER',
                    conversationId: conversation.id,
                },
            })

            // Build context
            const historyMessages = await this.prisma.aiChatMessage.findMany({
                where: { conversationId: conversation.id },
                orderBy: { createdAt: 'asc' },
                take: 20,
            })

            const contextPrompt = this.buildContextPrompt(historyMessages, message)

            // Stream AI response
            let fullAnswer = ''
            for await (const chunk of askDeepSeekStream(contextPrompt)) {
                fullAnswer += chunk
                yield { type: 'content', content: chunk, conversationId: conversation.id }
            }

            // Save AI response
            const aiMessage = await this.prisma.aiChatMessage.create({
                data: {
                    content: fullAnswer,
                    role: 'ASSISTANT',
                    conversationId: conversation.id,
                },
            })

            yield {
                type: 'done',
                conversationId: conversation.id,
                messageId: aiMessage.id,
            }
        } catch (error: any) {
            yield { type: 'error', error: error.message || 'AI service unavailable' }
        }
    }

    /**
     * Get user's AI chat conversations
     */
    async getConversations(userId: string, page = 1, limit = 20) {
        const skip = (page - 1) * limit

        const [conversations, total] = await Promise.all([
            this.prisma.aiChatConversation.findMany({
                where: { userId },
                orderBy: { updatedAt: 'desc' },
                skip,
                take: limit,
                include: {
                    messages: {
                        orderBy: { createdAt: 'asc' },
                        take: 1,
                        select: {
                            id: true,
                            content: true,
                            role: true,
                            createdAt: true,
                        },
                    },
                },
            }),
            this.prisma.aiChatConversation.count({ where: { userId } }),
        ])

        return {
            code: 0,
            message: 'Conversations loaded',
            result: {
                conversations: conversations.map((c) => ({
                    id: c.id,
                    title: c.title || 'Untitled',
                    lastMessage: c.messages[0]?.content?.substring(0, 100) || '',
                    createdAt: c.createdAt,
                    updatedAt: c.updatedAt,
                })),
                total,
                page,
                limit,
            },
        }
    }

    /**
     * Get conversation messages
     */
    async getMessages(userId: string, conversationId: string) {
        const conversation = await this.prisma.aiChatConversation.findFirst({
            where: { id: conversationId, userId },
        })

        if (!conversation) {
            throw new NotFoundException('Conversation not found')
        }

        const messages = await this.prisma.aiChatMessage.findMany({
            where: { conversationId },
            orderBy: { createdAt: 'asc' },
            select: {
                id: true,
                content: true,
                role: true,
                createdAt: true,
                rating: true,
                feedback: true,
            },
        })

        return {
            code: 0,
            message: 'Messages loaded',
            result: {
                conversation: {
                    id: conversation.id,
                    title: conversation.title || 'Untitled',
                },
                messages,
            },
        }
    }

    /**
     * Delete conversation
     */
    async deleteConversation(userId: string, conversationId: string) {
        const conversation = await this.prisma.aiChatConversation.findFirst({
            where: { id: conversationId, userId },
        })

        if (!conversation) {
            throw new NotFoundException('Conversation not found')
        }

        await this.prisma.aiChatConversation.delete({
            where: { id: conversationId },
        })

        return {
            code: 0,
            message: 'Conversation deleted',
            result: null,
        }
    }

    /**
     * Build prompt with conversation context
     */
    private buildContextPrompt(
        historyMessages: Array<{ content: string; role: string }>,
        currentMessage: string,
    ): string {
        if (historyMessages.length <= 1) {
            return currentMessage
        }

        const contextParts: string[] = []
        for (const msg of historyMessages) {
            if (msg.content === currentMessage && msg.role === 'USER') continue
            const role = msg.role === 'USER' ? 'User' : 'AI'
            contextParts.push(`${role}: ${msg.content.substring(0, 500)}`)
        }

        const context = contextParts.join('\n')
        return `Previous conversation:\n${context}\n\nUser: ${currentMessage}\n\nPlease respond based on the conversation history above.`
    }
}
