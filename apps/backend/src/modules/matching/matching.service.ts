import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'
import { askDeepSeek, askDeepSeekStream } from '@jd-match/ai'
import { AigcConversation } from '@jd-match/database'
import * as fs from 'fs'

@Injectable()
export class MatchingService {
    constructor(private prisma: PrismaService) {}

    /**
     * 分析简历与JD的匹配度
     */
    async analyze(userId: string, file: Express.Multer.File, jdUrl: string) {
        // 读取简历文件内容
        let resumeContent = ''
        if (file) {
            const fileBuffer = fs.readFileSync(file.path)
            // TODO: 使用 pdf-parse / mammoth 解析 PDF/DOCX
            resumeContent = `[简历文件: ${file.originalname}]`
            // 清理临时文件
            fs.unlinkSync(file.path)
        }

        // 构建匹配分析 prompt
        const prompt = this.buildMatchingPrompt(resumeContent, jdUrl)
        const answer = await askDeepSeek(prompt)

        // 保存匹配记录
        const conversation = await this.prisma.aigcConversation.create({
            data: {
                title: `匹配分析 - ${new Date().toLocaleDateString('zh-CN')}`,
                userId,
            },
        })

        await this.prisma.aigcMessage.create({
            data: {
                content: prompt,
                role: 'USER',
                conversationId: conversation.id,
            },
        })

        await this.prisma.aigcMessage.create({
            data: {
                content: answer,
                role: 'ASSISTANT',
                conversationId: conversation.id,
            },
        })

        return {
            code: 0,
            message: '匹配分析完成',
            result: {
                conversationId: conversation.id,
                analysis: answer,
            },
        }
    }

    /**
     * 流式匹配分析
     */
    async *analyzeStream(
        userId: string,
        file: Express.Multer.File,
        jdUrl: string,
    ): AsyncGenerator<SSEChunk, void, unknown> {
        let resumeContent = ''
        if (file) {
            resumeContent = `[简历文件: ${file.originalname}]`
        }

        const prompt = this.buildMatchingPrompt(resumeContent, jdUrl)

        // 创建匹配记录
        const conversation = await this.prisma.aigcConversation.create({
            data: {
                title: `匹配分析 - ${new Date().toLocaleDateString('zh-CN')}`,
                userId,
            },
        })

        // 保存用户请求
        const userMessage = await this.prisma.aigcMessage.create({
            data: {
                content: prompt,
                role: 'USER',
                conversationId: conversation.id,
            },
        })

        yield {
            type: 'meta',
            matchingId: conversation.id,
            messageId: userMessage.id,
        }

        // 流式输出 AI 分析
        let fullAnswer = ''
        try {
            for await (const token of askDeepSeekStream(prompt)) {
                fullAnswer += token
                yield { type: 'token', content: token }
            }
        } catch (error) {
            yield { type: 'error', content: '抱歉，AI 分析出错，请稍后再试。' }
        }

        // 保存助手消息
        if (fullAnswer) {
            await this.prisma.aigcMessage.create({
                data: {
                    content: fullAnswer,
                    role: 'ASSISTANT',
                    conversationId: conversation.id,
                },
            })
        }

        // 清理临时文件
        if (file && fs.existsSync(file.path)) {
            fs.unlinkSync(file.path)
        }

        yield { type: 'done' }
    }

    async getConversations(userId: string, page = 1, limit = 10) {
        // 防御性校验
        const safePage = Math.max(1, page)
        const safeLimit = Math.min(50, Math.max(1, limit))
        const skip = (safePage - 1) * safeLimit

        const [data, total] = await Promise.all([
            this.prisma.aigcConversation.findMany({
                where: { userId, deletedAt: null },
                orderBy: { updatedAt: 'desc' },
                skip,
                take: safeLimit,
                include: {
                    _count: { select: { messages: true } },
                },
            }),
            this.prisma.aigcConversation.count({
                where: { userId, deletedAt: null },
            }),
        ])

        return {
            code: 0,
            message: '查询成功',
            result: data,
            total,
            page: safePage,
            limit: safeLimit,
            totalPages: Math.ceil(total / safeLimit),
        }
    }

    async getConversationDetail(conversationId: string, userId: string) {
        const conversation = await this.prisma.aigcConversation.findFirst({
            where: { id: conversationId, userId, deletedAt: null },
            include: {
                messages: {
                    orderBy: { createdAt: 'asc' },
                },
            },
        })

        if (!conversation) {
            throw new NotFoundException('匹配记录未找到')
        }

        return {
            code: 0,
            message: '查询成功',
            result: conversation,
        }
    }

    async getMessages(conversationId: string, userId: string) {
        const messages = await this.prisma.aigcMessage.findMany({
            where: {
                conversationId,
                conversation: { userId, deletedAt: null },
            },
            orderBy: { createdAt: 'asc' },
        })

        return {
            code: 0,
            message: '查询成功',
            result: messages,
        }
    }

    async deleteConversation(conversationId: string, userId: string) {
        const conversation = await this.prisma.aigcConversation.findFirst({
            where: { id: conversationId, userId, deletedAt: null },
        })

        if (!conversation) {
            throw new NotFoundException('匹配记录未找到')
        }

        await this.prisma.aigcConversation.update({
            where: { id: conversationId },
            data: { deletedAt: new Date() },
        })

        return {
            code: 0,
            message: '删除成功',
        }
    }

    /**
     * 构建匹配分析 prompt
     */
    private buildMatchingPrompt(resumeContent: string, jdUrl: string): string {
        return `请分析以下简历与目标岗位的匹配度，并给出详细的优化建议。

## 简历内容
${resumeContent}

## 目标岗位链接
${jdUrl}

请从以下维度进行分析并输出结构化报告（用 Markdown 格式）：

1. **综合匹配度**：给出整体匹配度评分（满分100分）
2. **关键词匹配**：简历中的关键词与JD要求的吻合程度
3. **技能匹配**：技能栈的覆盖情况，列出已匹配和缺失的技能
4. **经验匹配**：工作经验与岗位要求的契合度
5. **学历匹配**：学历背景是否符合要求
6. **优势分析**：候选人的突出优势
7. **待提升项**：需要改进的方面
8. **简历优化建议**：具体的简历修改建议（按优先级排列）
9. **技能差距**：需要补充学习的技能清单

请保持专业、建设性的口吻，用中文回答。`
    }
}

interface SSEChunk {
    type: 'meta' | 'token' | 'error' | 'done'
    content?: string
    matchingId?: string
    messageId?: string
}
