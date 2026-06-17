import {
    Controller,
    Get,
    Post,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    Req,
    Res,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import type { Request, Response } from 'express'
import { AiChatService } from './ai-chat.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

@ApiTags('ai-chat')
@Controller('ai-chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AiChatController {
    constructor(private readonly aiChatService: AiChatService) {}

    /**
     * 普通对话（非流式）
     */
    @Post('chat')
    @ApiOperation({ summary: '发送消息给AI助手（非流式）' })
    async chat(
        @Body('message') message: string,
        @Body('conversationId') conversationId: string | undefined,
        @Req() req: any,
    ) {
        return this.aiChatService.chat(req.user.userId, message, conversationId)
    }

    /**
     * 流式对话（SSE）
     */
    @Post('chat/stream')
    @ApiOperation({ summary: '发送消息给AI助手（SSE流式）' })
    async chatStream(
        @Body('message') message: string,
        @Body('conversationId') conversationId: string | undefined,
        @Req() req: any,
        @Res() res: Response,
    ) {
        // 设置 SSE 响应头
        res.setHeader('Content-Type', 'text/event-stream')
        res.setHeader('Cache-Control', 'no-cache')
        res.setHeader('Connection', 'keep-alive')
        res.setHeader('X-Accel-Buffering', 'no')
        res.flushHeaders()

        try {
            for await (const chunk of this.aiChatService.chatStream(
                req.user.userId,
                message,
                conversationId,
            )) {
                res.write(`data: ${JSON.stringify(chunk)}\n\n`)
            }
        } catch (error: any) {
            res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`)
        } finally {
            res.end()
        }
    }

    /**
     * 获取对话列表
     */
    @Get('conversations')
    @ApiOperation({ summary: '获取AI对话列表' })
    async getConversations(
        @Req() req: any,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.aiChatService.getConversations(
            req.user.userId,
            page ? parseInt(page) : 1,
            limit ? parseInt(limit) : 20,
        )
    }

    /**
     * 获取对话消息
     */
    @Get('conversations/:conversationId')
    @ApiOperation({ summary: '获取指定对话的消息列表' })
    async getMessages(
        @Req() req: any,
        @Param('conversationId', ) conversationId: string,
    ) {
        return this.aiChatService.getMessages(req.user.userId, conversationId)
    }

    /**
     * 删除对话
     */
    @Delete('conversations/:conversationId')
    @ApiOperation({ summary: '删除AI对话' })
    async deleteConversation(
        @Req() req: any,
        @Param('conversationId', ) conversationId: string,
    ) {
        return this.aiChatService.deleteConversation(req.user.userId, conversationId)
    }
}
