import { Controller, Get, Param, Query, Res, HttpStatus } from '@nestjs/common'
import type { Response } from 'express'
import { MatchingService } from './matching.service'

/**
 * 简历预览代理控制器
 * 不经过 JwtAuthGuard，通过 URL 中的临时 token 鉴权
 * 后端从 OSS 下载文件后强制返回 Content-Disposition: inline
 */
@Controller('matching')
export class MatchingPreviewController {
    constructor(private readonly matchingService: MatchingService) {}

    @Get('conversations/:conversationId/resume/preview')
    async previewResume(
        @Param('conversationId') _conversationId: string,
        @Query('token') token: string,
        @Res() res: Response,
    ) {
        if (!token) {
            res.status(HttpStatus.UNAUTHORIZED).json({ code: 1, message: '缺少预览令牌' })
            return
        }

        try {
            const { buffer, fileName, mimeType } =
                await this.matchingService.getResumeForPreview(token)

            res.set({
                'Content-Type': mimeType,
                'Content-Disposition': `inline; filename="${encodeURIComponent(fileName)}"`,
                'Content-Length': buffer.length.toString(),
                'Cache-Control': 'private, max-age=3600',
            })

            res.send(buffer)
        } catch (error) {
            const err = error as any
            res.status(err.status || HttpStatus.INTERNAL_SERVER_ERROR).json({
                code: 1,
                message: err.message || '预览加载失败',
            })
        }
    }
}
