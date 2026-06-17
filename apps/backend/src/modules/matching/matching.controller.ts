import {
    Controller,
    Get,
    Post,
    Delete,
    Body,
    Param,
    UseGuards,
    Req,
    Res,
    UploadedFile,
    UseInterceptors,
    BadRequestException,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger'
import type { Response } from 'express'
import { MatchingService } from './matching.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { memoryStorage } from 'multer'

@ApiTags('matching')
@Controller('matching')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MatchingController {
    constructor(private readonly matchingService: MatchingService) {}

    /**
     * 上传简历 + JD（链接或文本），执行匹配分析
     */
    @Post('analyze')
    @ApiOperation({ summary: '上传简历并进行岗位匹配分析（支持 JD 链接/文本）' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(
        FileInterceptor('resume', {
            storage: memoryStorage(),
            limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
            fileFilter: (_req, file, cb) => {
                const allowedMimes = [
                    'application/pdf',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                ]
                if (allowedMimes.includes(file.mimetype)) {
                    cb(null, true)
                } else {
                    cb(new BadRequestException('仅支持 PDF 和 DOCX 格式'), false)
                }
            },
        }),
    )
    async analyze(
        @UploadedFile() file: Express.Multer.File,
        @Body('jdUrl') jdUrl?: string,
        @Body('jdContent') jdContent?: string,
        @Req() req?: any,
    ) {
        if (!file) {
            throw new BadRequestException('请上传简历文件')
        }
        if (!jdUrl && !jdContent) {
            throw new BadRequestException('请提供岗位链接或粘贴岗位描述内容')
        }

        return this.matchingService.analyze(req.user.userId, file, jdUrl || null, jdContent || null)
    }

    /**
     * SSE 流式匹配分析
     */
    @Post('analyze/stream')
    @ApiOperation({ summary: '流式匹配分析（SSE 推送结果）' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(
        FileInterceptor('resume', {
            storage: memoryStorage(),
            limits: { fileSize: 10 * 1024 * 1024 },
            fileFilter: (_req, file, cb) => {
                const allowedMimes = [
                    'application/pdf',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                ]
                if (allowedMimes.includes(file.mimetype)) {
                    cb(null, true)
                } else {
                    cb(new BadRequestException('仅支持 PDF 和 DOCX 格式'), false)
                }
            },
        }),
    )
    async analyzeStream(
        @UploadedFile() file: Express.Multer.File,
        @Body('jdUrl') jdUrl?: string,
        @Body('jdContent') jdContent?: string,
        @Req() req?: any,
        @Res() res?: Response,
    ) {
        if (!file) {
            res!.status(400).json({ code: 1, message: '请上传简历文件' })
            return
        }
        if (!jdUrl && !jdContent) {
            res!.status(400).json({ code: 1, message: '请提供岗位链接或粘贴岗位描述内容' })
            return
        }

        res!.setHeader('Content-Type', 'text/event-stream')
        res!.setHeader('Cache-Control', 'no-cache')
        res!.setHeader('Connection', 'keep-alive')
        res!.setHeader('X-Accel-Buffering', 'no')
        res!.flushHeaders()

        try {
            const stream = this.matchingService.analyzeStream(
                req!.user.userId,
                file,
                jdUrl || null,
                jdContent || null,
            )
            for await (const chunk of stream) {
                res!.write(`data: ${JSON.stringify(chunk)}\n\n`)
                if (chunk.type === 'done' || chunk.type === 'error') {
                    break
                }
            }
        } catch (error: any) {
            res!.write(
                `data: ${JSON.stringify({ type: 'error', content: error.message || '服务器内部错误' })}\n\n`,
            )
        } finally {
            res!.write('data: [DONE]\n\n')
            res!.end()
        }
    }

    @Get('conversations')
    @ApiOperation({ summary: '获取所有匹配记录' })
    async getConversations(@Req() req: any) {
        return this.matchingService.getConversations(req.user.userId)
    }

    @Get('conversations/:conversationId')
    @ApiOperation({ summary: '获取匹配详情' })
    async getConversationDetail(@Param('conversationId') conversationId: string, @Req() req: any) {
        return this.matchingService.getConversationDetail(conversationId, req.user.userId)
    }

    @Delete('conversations/:conversationId')
    @ApiOperation({ summary: '删除匹配记录' })
    async deleteConversation(@Param('conversationId') conversationId: string, @Req() req: any) {
        return this.matchingService.deleteConversation(conversationId, req.user.userId)
    }
}
