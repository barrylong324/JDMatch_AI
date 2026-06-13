import {
    Controller,
    Post,
    UploadedFile,
    UseInterceptors,
    Body,
    Param,
    UseGuards,
    Req,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger'
import { UploadsService } from './uploads.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

@ApiTags('uploads')
@Controller('upload')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UploadsController {
    constructor(private readonly uploadsService: UploadsService) {}

    @Post()
    @ApiOperation({ summary: 'Upload a document' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(
        @Param('kbId') kbId: string,
        @UploadedFile() file: Express.Multer.File,
        @Body() body: { title?: string; tags?: string },
        @Req() req: any,
    ) {
        if (!file) {
            throw new Error('No file uploaded')
        }

        const tags = body.tags ? JSON.parse(body.tags) : []

        return this.uploadsService.processUploadedFile(
            file,
            kbId,
            req.user.userId,
            body.title,
            tags,
        )
    }
}
