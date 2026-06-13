import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'
import { askDeepSeek, askDeepSeekStream } from '@rag-ai/ai'
import { AigcConversation } from '@rag-ai/database'

@Injectable()
export class AigcNormalService {
    constructor(private prisma: PrismaService) {}

    async sendMessage(userId: string, content: string, conversationId?: string) {
        let aigcConversation: AigcConversation | null

        // Find or create aigcConversation
        if (conversationId) {
            aigcConversation = await this.prisma.aigcConversation.findFirst({
                where: {
                    id: conversationId,
                    deletedAt: null,
                },
            })

            if (!aigcConversation) {
                throw new NotFoundException('Conversation not found')
            }
        } else {
            aigcConversation = await this.prisma.aigcConversation.create({
                data: {
                    title: content.substring(0, 100),
                    userId,
                },
            })
        }

        // Save user message
        const userMessage = await this.prisma.aigcMessage.create({
            data: {
                content,
                role: 'USER',
                conversationId: aigcConversation.id,
            },
        })

        const answer = await askDeepSeek(content)
        return {
            messageId: userMessage.id,
            answer,
            sources: '',
            conversationId: aigcConversation.id,
        }
    }

    /**
     * 流式发送消息 — 返回异步生成器，逐 token 产出
     * 完成后会保存助手消息到数据库
     */
    async *sendMessageStream(
        userId: string,
        content: string,
        conversationId?: string,
    ): AsyncGenerator<SSEChunk, void, unknown> {
        let aigcConversation: AigcConversation | null

        // Find or create conversation
        if (conversationId) {
            aigcConversation = await this.prisma.aigcConversation.findFirst({
                where: { id: conversationId, deletedAt: null },
            })
            if (!aigcConversation) {
                throw new NotFoundException('Conversation not found')
            }
        } else {
            aigcConversation = await this.prisma.aigcConversation.create({
                data: {
                    title: content.substring(0, 100),
                    userId,
                },
            })
        }

        // Save user message
        const userMessage = await this.prisma.aigcMessage.create({
            data: {
                content,
                role: 'USER',
                conversationId: aigcConversation.id,
            },
        })

        // 先发送元信息（conversationId, messageId）
        yield {
            type: 'meta',
            conversationId: aigcConversation.id,
            messageId: userMessage.id,
        }

        // 流式产出 AI 回复 token
        let fullAnswer = ''
        try {
            for await (const token of askDeepSeekStream(content)) {
                fullAnswer += token
                yield { type: 'token', content: token }
            }
        } catch (error) {
            yield { type: 'error', content: '抱歉，AI 响应出错，请稍后再试。' }
        }

        // 保存助手消息
        if (fullAnswer) {
            await this.prisma.aigcMessage.create({
                data: {
                    content: fullAnswer,
                    role: 'ASSISTANT',
                    conversationId: aigcConversation.id,
                },
            })
        }

        // 结束标记
        yield { type: 'done' }
    }

    async getConversations(userId: string) {
        return this.prisma.aigcConversation.findMany({
            where: {
                userId,
                deletedAt: null,
            },
            orderBy: { updatedAt: 'desc' },
            include: {
                _count: {
                    select: { messages: true },
                },
            },
        })
    }

    async getMessages(conversationId: string, userId: string): Promise<any[]> {
        const aigcConversation = await this.prisma.aigcConversation.findFirst({
            where: {
                id: conversationId,
                userId,
            },
        })

        if (!aigcConversation) {
            throw new NotFoundException('Conversation not found')
        }

        return this.prisma.aigcMessage.findMany({
            where: { conversationId },
            orderBy: { createdAt: 'asc' },
        })
    }

    async deleteConversation(conversationId: string, userId: string) {
        const aigcConversation = await this.prisma.aigcConversation.findFirst({
            where: { id: conversationId, userId },
        })

        if (!aigcConversation) {
            throw new NotFoundException('Conversation not found')
        }

        await this.prisma.aigcConversation.update({
            where: { id: conversationId },
            data: { deletedAt: new Date() },
        })
    }
}

/** SSE 流式数据块类型 */
export interface SSEChunk {
    type: 'meta' | 'token' | 'error' | 'done'
    content?: string
    conversationId?: string
    messageId?: string
}
