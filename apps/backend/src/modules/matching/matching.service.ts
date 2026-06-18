import { Injectable, NotFoundException, Logger } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'
import { FileUploadService } from '../../common/storage/file-upload.service'
import { JdFetcherService } from '../../common/storage/jd-fetcher.service'
import { S3Service } from '../../common/storage/s3.service'
import { askDeepSeek, askDeepSeekStream } from '@jd-match/ai'

@Injectable()
export class MatchingService {
    private readonly logger = new Logger(MatchingService.name)

    constructor(
        private prisma: PrismaService,
        private readonly fileUploadService: FileUploadService,
        private readonly jdFetcherService: JdFetcherService,
        private readonly s3Service: S3Service,
    ) {}

    /**
     * 分析简历与JD的匹配度（非流式）
     */
    async analyze(
        userId: string,
        file: Express.Multer.File,
        jdUrl: string | null,
        jdContent: string | null,
    ) {
        // multer 处理中文文件名时可能使用 latin1 编码，需要转 utf-8
        const safeName = Buffer.from(file.originalname, 'latin1').toString('utf8')

        // 1. 上传简历到 S3 并解析文本（使用内存中的 buffer）
        const uploadResult = await this.fileUploadService.uploadResume(
            file.buffer,
            safeName,
            file.mimetype,
        )

        const resumeText = uploadResult.parsedText || `[简历文件: ${file.originalname}，解析失败]`

        // 2. 获取 JD 内容
        const jdResult = await this.jdFetcherService.fetchJdContent(jdUrl || jdContent || '')

        // 3. 构建匹配分析 prompt（使用真实文本内容）
        const prompt = this.buildMatchingPrompt(resumeText, jdResult.content, jdResult.url)

        // 4. 调用 AI 分析
        const answer = await askDeepSeek(prompt, 'pro')

        // 5. 保存匹配记录（含简历文件信息）
        const title = this.extractJdTitle(jdResult.content) || '匹配分析'
        const conversation = await this.prisma.aigcConversation.create({
            data: {
                title: `${title} - ${new Date().toLocaleDateString('zh-CN')}`,
                userId,
                resumeKey: uploadResult.key,
                resumeName: uploadResult.originalName,
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

        this.logger.log(`Matching completed for user ${userId}, conversation: ${conversation.id}`)

        return {
            code: 0,
            message: '匹配分析完成',
            result: {
                conversationId: conversation.id,
                resumeUrl: uploadResult.url,
                analysis: answer,
            },
        }
    }

    /**
     * 流式匹配分析（SSE）
     */
    async *analyzeStream(
        userId: string,
        file: Express.Multer.File,
        jdUrl: string | null,
        jdContent: string | null,
    ): AsyncGenerator<SSEChunk, void, unknown> {
        // multer 处理中文文件名时可能使用 latin1 编码，需要转 utf-8
        const safeName = Buffer.from(file.originalname, 'latin1').toString('utf8')

        // 1. 上传简历到 S3 并解析（使用内存中的 buffer）
        yield { type: 'status', content: '正在解析简历文件...' }

        const uploadResult = await this.fileUploadService.uploadResume(
            file.buffer,
            safeName,
            file.mimetype,
        )

        const resumeText = uploadResult.parsedText || `[简历文件: ${file.originalname}，解析失败]`

        // 2. 获取 JD 内容
        yield { type: 'status', content: '正在获取岗位描述...' }
        let jdText: string
        let jdSource: string | undefined

        try {
            const jdResult = await this.jdFetcherService.fetchJdContent(jdUrl || jdContent || '')
            jdText = jdResult.content
            jdSource = jdResult.url
        } catch (error) {
            yield { type: 'error', content: `获取岗位描述失败: ${(error as Error).message}` }
            return
        }

        // 3. 构建 prompt 并开始流式分析
        const prompt = this.buildMatchingPrompt(resumeText, jdText, jdSource)

        // 4. 创建匹配记录（含简历文件信息）
        const title = this.extractJdTitle(jdText) || '匹配分析'
        const conversation = await this.prisma.aigcConversation.create({
            data: {
                title: `${title} - ${new Date().toLocaleDateString('zh-CN')}`,
                userId,
                resumeKey: uploadResult.key,
                resumeName: uploadResult.originalName,
            },
        })

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
            resumeUrl: uploadResult.url,
        }

        // 5. 流式输出 AI 分析
        let fullAnswer = ''
        try {
            for await (const token of askDeepSeekStream(prompt, 'pro')) {
                fullAnswer += token
                yield { type: 'token', content: token }
            }
        } catch (error) {
            this.logger.error('AI stream error:', error)
            yield { type: 'error', content: '抱歉，AI 分析出错，请稍后再试。' }
        }

        // 6. 保存助手消息
        if (fullAnswer) {
            await this.prisma.aigcMessage.create({
                data: {
                    content: fullAnswer,
                    role: 'ASSISTANT',
                    conversationId: conversation.id,
                },
            })
        }

        this.logger.log(`Stream matching completed for user ${userId}, conv: ${conversation.id}`)
        yield { type: 'done' }
    }

    async getConversations(userId: string) {
        const data = await this.prisma.aigcConversation.findMany({
            where: { userId, deletedAt: null },
            orderBy: { updatedAt: 'desc' },
            select: {
                id: true,
                title: true,
                resumeName: true,
                createdAt: true,
            },
        })

        return {
            code: 0,
            message: '查询成功',
            result: data,
        }
    }

    async getConversationDetail(conversationId: string, userId: string) {
        const conversation = await this.prisma.aigcConversation.findFirst({
            where: { id: conversationId, userId, deletedAt: null },
            select: {
                id: true,
                title: true,
                resumeKey: true,
                resumeName: true,
                createdAt: true,
                updatedAt: true,
                messages: {
                    orderBy: { createdAt: 'asc' },
                },
            },
        })

        if (!conversation) {
            throw new NotFoundException('匹配记录未找到')
        }

        // 生成简历预签名下载 URL（1小时有效）
        let resumeUrl: string | null = null
        if (conversation.resumeKey) {
            try {
                resumeUrl = await this.s3Service.getPresignedUrl(conversation.resumeKey, 3600)
            } catch (error) {
                this.logger.warn(`Failed to generate presigned URL for ${conversation.resumeKey}`)
            }
        }

        // 从消息中提取 JD 内容（USER 消息中的 JD 部分）
        const userMessage = conversation.messages.find((m) => m.role === 'USER')
        const assistantMessage = conversation.messages.find((m) => m.role === 'ASSISTANT')

        return {
            code: 0,
            message: '查询成功',
            result: {
                id: conversation.id,
                title: conversation.title,
                status: assistantMessage ? 'COMPLETED' : 'IN_PROGRESS',
                resumeName: conversation.resumeName,
                resumeUrl,
                userMessage: userMessage?.content || null,
                assistantMessage: assistantMessage?.content || null,
                messages: conversation.messages,
                createdAt: conversation.createdAt,
                updatedAt: conversation.updatedAt,
            },
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
    private buildMatchingPrompt(resumeContent: string, jdContent: string, jdUrl?: string): string {
        const jdSection = jdUrl
            ? `## 目标岗位\n**来源链接**: ${jdUrl}\n\n${jdContent}`
            : `## 目标岗位\n${jdContent}`

        return `你是一位专业的简历优化和岗位匹配分析专家。请仔细分析以下简历与目标岗位描述的匹配度，并给出详细的评估报告。

## 简历内容
${resumeContent}

${jdSection}

请从以下维度进行深入分析，并用 Markdown 格式输出一份结构化报告：

### 1. 📊 综合匹配度
给出整体匹配度评分（满分100分），并简要说明评分依据。

### 2. 🔑 关键词匹配度（满分100分）
分析简历中的关键词与JD要求的吻合程度，列出匹配的关键词和缺失的关键词。

### 3. 🛠️ 技能匹配度（满分100分）
技能栈的覆盖情况，列出已匹配的技能和缺失的技能。

### 4. 💼 经验匹配度（满分100分）
工作经验和项目经验与岗位要求的契合度分析。

### 5. 🎓 学历匹配度（满分100分）
学历背景、专业是否符合岗位要求。

### 6. ✅ 优势分析
列出候选人的突出优势（3-5条）。

### 7. ⚠️ 待提升项
列出需要改进的方面（3-5条）。

### 8. 💡 简历优化建议
给出具体的简历修改建议，按优先级排列（4-6条）。

### 9. 🎯 技能差距清单
列出候选人需要补充学习的技能（3-6个）。

请保持专业、建设性的口吻，用中文回答。报告不要包含候选人姓名和评估日期。不要使用Markdown代码块包裹整个报告。`
    }

    /**
     * 从 JD 内容中提取岗位名称
     */
    private extractJdTitle(jdContent: string): string | null {
        // 尝试匹配常见的岗位名称模式
        const patterns = [
            /岗位名称[：:]\s*(.+?)(?:\n|$)/,
            /职位名称[：:]\s*(.+?)(?:\n|$)/,
            /招聘[：:]\s*(.+?)(?:\n|$)/,
            /【(.+?)】/, // 【高级前端工程师】
        ]

        for (const pattern of patterns) {
            const match = jdContent.match(pattern)
            if (match && match[1]?.trim().length < 50) {
                return match[1].trim()
            }
        }

        // 取第一行中长度合适的作为标题
        const firstLine = jdContent.split('\n')[0]?.trim()
        if (firstLine && firstLine.length < 60) {
            return firstLine
        }

        return null
    }
}

interface SSEChunk {
    type: 'meta' | 'token' | 'status' | 'error' | 'done'
    content?: string
    matchingId?: string
    messageId?: string
    resumeUrl?: string
}
