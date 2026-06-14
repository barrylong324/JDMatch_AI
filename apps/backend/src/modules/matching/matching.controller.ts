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
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger'
import type { Response } from 'express'
import { MatchingService } from './matching.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { diskStorage } from 'multer'
import { extname } from 'path'

@ApiTags('matching')
@Controller('matching')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MatchingController {
    constructor(private readonly matchingService: MatchingService) {}

    /**
     * 上传简历 + JD链接，执行匹配分析
     */
    @Post('analyze')
    @ApiOperation({ summary: '上传简历并进行岗位匹配分析' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(
        FileInterceptor('resume', {
            storage: diskStorage({
                destination: './uploads/temp',
                filename: (_req, file, cb) => {
                    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
                    cb(null, uniqueSuffix + extname(file.originalname))
                },
            }),
            limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
            fileFilter: (_req, file, cb) => {
                const allowed = ['.pdf', '.docx']
                const ext = extname(file.originalname).toLowerCase()
                if (allowed.includes(ext)) {
                    cb(null, true)
                } else {
                    cb(new Error('仅支持 PDF 和 DOCX 格式'), false)
                }
            },
        }),
    )
    async analyze(
        @UploadedFile() file: Express.Multer.File,
        @Body('jdUrl') jdUrl: string,
        @Req() req: any,
    ) {
        return this.matchingService.analyze(req.user.userId, file, jdUrl)
    }

    /**
     * SSE 流式匹配分析
     */
    @Post('analyze/stream')
    @ApiOperation({ summary: '流式匹配分析（SSE 推送结果）' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(
        FileInterceptor('resume', {
            storage: diskStorage({
                destination: './uploads/temp',
                filename: (_req, file, cb) => {
                    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
                    cb(null, uniqueSuffix + extname(file.originalname))
                },
            }),
            limits: { fileSize: 10 * 1024 * 1024 },
            fileFilter: (_req, file, cb) => {
                const allowed = ['.pdf', '.docx']
                const ext = extname(file.originalname).toLowerCase()
                if (allowed.includes(ext)) {
                    cb(null, true)
                } else {
                    cb(new Error('仅支持 PDF 和 DOCX 格式'), false)
                }
            },
        }),
    )
    async analyzeStream(
        @UploadedFile() file: Express.Multer.File,
        @Body('jdUrl') jdUrl: string,
        @Req() req: any,
        @Res() res: Response,
    ) {
        res.setHeader('Content-Type', 'text/event-stream')
        res.setHeader('Cache-Control', 'no-cache')
        res.setHeader('Connection', 'keep-alive')
        res.setHeader('X-Accel-Buffering', 'no')
        res.flushHeaders()

        try {
            const stream = this.matchingService.analyzeStream(req.user.userId, file, jdUrl)
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
    @ApiOperation({ summary: '获取所有匹配记录（分页）' })
    async getConversations(
        @Req() req: any,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        const pageNum = Math.max(1, parseInt(page || '1', 10) || 1)
        const limitNum = Math.min(50, Math.max(1, parseInt(limit || '10', 10) || 10))
        return this.matchingService.getConversations(req.user.userId, pageNum, limitNum)
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
