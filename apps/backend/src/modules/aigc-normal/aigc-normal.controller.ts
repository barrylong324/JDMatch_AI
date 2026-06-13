import { Controller, Get, Post, Delete, Body, Param, UseGuards, Req, Res } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import type { Response } from 'express'
import { AigcNormalService } from './aigc-normal.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

interface SendMessageDto {
    kbId: string
    content: string
    conversationId?: string
}

@ApiTags('aigc-normal')
@Controller('aigcChat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AigcNormalController {
    constructor(private readonly aigcNormalService: AigcNormalService) {}

    @Post('message')
    @ApiOperation({ summary: '发送消息并得到AI相应' })
    async sendMessage(@Body() body: SendMessageDto, @Req() req: any) {
        return this.aigcNormalService.sendMessage(
            req.user.userId,
            body.content,
            body.conversationId,
        )
    }

    /**
     * SSE 流式消息端点
     * 使用 ReadableStream 方式推送 AI 回复的每个 token
     */
    @Post('message/stream')
    @ApiOperation({ summary: '发送消息并以 SSE 流式返回 AI 回复（打字机效果）' })
    async sendMessageStream(@Body() body: SendMessageDto, @Req() req: any, @Res() res: Response) {
        // 设置 SSE 响应头
        res.setHeader('Content-Type', 'text/event-stream')
        res.setHeader('Cache-Control', 'no-cache')
        res.setHeader('Connection', 'keep-alive')
        res.setHeader('X-Accel-Buffering', 'no') // 禁用 nginx 缓冲
        res.flushHeaders()

        try {
            const stream = this.aigcNormalService.sendMessageStream(
                req.user.userId,
                body.content,
                body.conversationId,
            )

            for await (const chunk of stream) {
                res.write(`data: ${JSON.stringify(chunk)}\n\n`)
                if (chunk.type === 'done' || chunk.type === 'error') {
                    break
                }
            }
        } catch (error: any) {
            res.write(
                `data: ${JSON.stringify({ type: 'error', content: error.message || '服务器内部错误' })}\n\n`,
            )
        } finally {
            res.write('data: [DONE]\n\n')
            res.end()
        }
    }

    @Get('conversations')
    @ApiOperation({ summary: '获取所有对话' })
    async getConversations(@Req() req: any) {
        return this.aigcNormalService.getConversations(req.user.userId)
    }

    @Get('conversations/messages/:conversationId')
    @ApiOperation({ summary: '获取会话中的消息' })
    async getMessages(@Param('conversationId') conversationId: string, @Req() req: any) {
        return this.aigcNormalService.getMessages(conversationId, req.user.userId)
    }

    @Delete('conversations/:conversationId')
    @ApiOperation({ summary: '删除会话' })
    async deleteConversation(@Param('conversationId') conversationId: string, @Req() req: any) {
        return this.aigcNormalService.deleteConversation(conversationId, req.user.userId)
    }
}
