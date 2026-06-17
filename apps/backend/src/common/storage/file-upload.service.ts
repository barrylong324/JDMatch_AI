import { Injectable, Logger, BadRequestException } from '@nestjs/common'
import { S3Service } from './s3.service'
import { DocumentParserService } from './document-parser.service'

export interface UploadedFileInfo {
    key: string // S3 存储 key
    url: string // 预签名访问 URL
    originalName: string // 原始文件名
    size: number // 文件大小 (bytes)
    mimeType: string // MIME 类型
    parsedText?: string // 解析后的文本内容
}

@Injectable()
export class FileUploadService {
    private readonly logger = new Logger(FileUploadService.name)

    private readonly allowedMimeTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]

    private readonly maxFileSize = 10 * 1024 * 1024 // 10MB

    constructor(
        private readonly s3Service: S3Service,
        private readonly documentParser: DocumentParserService,
    ) {}

    /**
     * 上传并解析简历文件
     */
    async uploadResume(
        fileBuffer: Buffer,
        originalName: string,
        mimeType: string,
    ): Promise<UploadedFileInfo> {
        // 校验文件类型
        this.validateFile(mimeType, fileBuffer.length)

        // 上传到 S3
        const { key, url } = await this.s3Service.uploadFile(
            fileBuffer,
            originalName,
            mimeType,
            'resumes',
        )

        const fileInfo: UploadedFileInfo = {
            key,
            url,
            originalName,
            size: fileBuffer.length,
            mimeType,
        }

        // 解析文档内容
        try {
            fileInfo.parsedText = await this.documentParser.parseDocument(fileBuffer, mimeType)
            this.logger.log(`Resume parsed: ${originalName} -> ${fileInfo.parsedText.length} chars`)
        } catch (error) {
            this.logger.error(`Resume parsing failed for ${originalName}:`, error)
            // 解析失败不影响上传，只是没有文本内容
            fileInfo.parsedText = undefined
        }

        return fileInfo
    }

    /**
     * 从 S3 下载并解析简历（用于已上传的文件）
     */
    async downloadAndParseResume(key: string): Promise<string> {
        const buffer = await this.s3Service.downloadFile(key)
        const text = await this.documentParser.parseDocument(buffer, 'application/pdf')
        return text
    }

    /**
     * 删除已上传的文件
     */
    async deleteFile(key: string): Promise<void> {
        await this.s3Service.deleteFile(key)
    }

    /**
     * 获取文件预签名 URL
     */
    async getFileUrl(key: string): Promise<string> {
        return this.s3Service.getPresignedUrl(key)
    }

    /**
     * 校验文件格式和大小
     */
    private validateFile(mimeType: string, fileSize: number): void {
        if (!this.allowedMimeTypes.includes(mimeType)) {
            throw new BadRequestException(
                `不支持的文件格式，仅允许 PDF 和 DOCX（当前: ${mimeType}）`,
            )
        }

        if (fileSize > this.maxFileSize) {
            throw new BadRequestException(
                `文件大小超过限制（最大 ${this.maxFileSize / 1024 / 1024}MB）`,
            )
        }
    }
}
