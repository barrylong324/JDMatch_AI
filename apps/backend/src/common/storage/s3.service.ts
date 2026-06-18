import { Injectable, Logger } from '@nestjs/common'
import {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
    GetObjectCommand,
    CreateBucketCommand,
    HeadBucketCommand,
    PutBucketPolicyCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { config, isDevelopment } from '@jd-match/config'
import { randomUUID } from 'crypto'
import { extname } from 'path'

@Injectable()
export class S3Service {
    private readonly logger = new Logger(S3Service.name)
    private readonly s3Client: S3Client
    private readonly bucket: string
    private readonly urlExpiresIn: number = 3600 // 预签名URL有效期(秒)

    constructor() {
        this.bucket = config.AWS_S3_BUCKET || 'jd-match-uploads'

        const isDev = isDevelopment

        // 确定 endpoint:
        //   开发环境 → MinIO (localhost:9000)
        //   生产环境 → 优先用 AWS_S3_ENDPOINT（OSS/COS/自建 MinIO 等）
        //             其次 region=auto → Cloudflare R2
        //             否则 → 标准 AWS S3 (endpoint=undefined)
        let endpoint: string | undefined
        let forcePathStyle: boolean

        if (isDev) {
            endpoint = 'http://localhost:9000'
            forcePathStyle = true
        } else if (config.AWS_S3_ENDPOINT) {
            // 阿里云 OSS / 腾讯云 COS / 自建 MinIO 等任意 S3 兼容服务
            endpoint = config.AWS_S3_ENDPOINT
            forcePathStyle = config.AWS_S3_FORCE_PATH_STYLE === 'true'
        } else if (config.AWS_S3_REGION === 'auto') {
            // Cloudflare R2（兼容旧配置）
            endpoint = `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`
            forcePathStyle = false
        } else {
            // 标准 AWS S3
            endpoint = undefined
            forcePathStyle = false
        }

        this.s3Client = new S3Client({
            region: config.AWS_S3_REGION || 'us-east-1',
            endpoint,
            credentials: {
                accessKeyId: isDev ? 'minioadmin' : config.AWS_ACCESS_KEY_ID || '',
                secretAccessKey: isDev ? 'minioadmin' : config.AWS_SECRET_ACCESS_KEY || '',
            },
            forcePathStyle,
        })

        const provider = isDev
            ? 'MinIO/dev'
            : config.AWS_S3_ENDPOINT
              ? 'Custom S3'
              : config.AWS_S3_REGION === 'auto'
                ? 'Cloudflare R2'
                : 'AWS S3'

        this.logger.log(
            `S3 Service initialized [${provider}] bucket=${this.bucket} endpoint=${endpoint ?? 'default'}`,
        )
    }

    /**
     * 上传文件到 S3
     * @param fileBuffer 文件内容
     * @param originalName 原始文件名
     * @param mimeType 文件 MIME 类型
     * @param folder 存储目录前缀 (如 'resumes', 'avatars')
     * @returns 上传后的 key 和可访问 URL
     */
    async uploadFile(
        fileBuffer: Buffer,
        originalName: string,
        mimeType: string,
        folder: string = 'uploads',
    ): Promise<{ key: string; url: string }> {
        const ext = extname(originalName).toLowerCase()
        const key = `${folder}/${randomUUID()}${ext}`

        const command = new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: fileBuffer,
            ContentType: mimeType,
            ContentDisposition: 'inline', // OSS 浏览器内联预览，不自动下载
            Metadata: {
                originalName: encodeURIComponent(originalName),
                uploadedAt: new Date().toISOString(),
            },
        })

        try {
            await this.s3Client.send(command)
            this.logger.log(`File uploaded: ${key} (${(fileBuffer.length / 1024).toFixed(1)} KB)`)

            // 生成预签名下载 URL
            const url = await this.getPresignedUrl(key)

            return { key, url }
        } catch (error) {
            this.logger.error(`Failed to upload file: ${key}`, error)
            throw new Error('文件上传失败，请稍后再试')
        }
    }

    /**
     * 获取预签名下载 URL（有效期 1 小时）
     */
    async getPresignedUrl(key: string, expiresIn: number = this.urlExpiresIn): Promise<string> {
        const command = new GetObjectCommand({
            Bucket: this.bucket,
            Key: key,
            ResponseContentDisposition: 'inline', // 浏览器内联预览PDF，不自动下载
        })

        try {
            return await getSignedUrl(this.s3Client, command, { expiresIn })
        } catch (error) {
            this.logger.error(`Failed to generate presigned URL for: ${key}`, error)
            throw new Error('获取文件访问链接失败')
        }
    }

    /**
     * 下载文件内容
     */
    async downloadFile(key: string): Promise<Buffer> {
        const command = new GetObjectCommand({
            Bucket: this.bucket,
            Key: key,
        })

        try {
            const response = await this.s3Client.send(command)
            // 将流式响应转换为 Buffer
            const stream = response.Body as any
            const chunks: Buffer[] = []
            for await (const chunk of stream) {
                chunks.push(Buffer.from(chunk))
            }
            return Buffer.concat(chunks)
        } catch (error) {
            this.logger.error(`Failed to download file: ${key}`, error)
            throw new Error('文件下载失败')
        }
    }

    /**
     * 删除文件
     */
    async deleteFile(key: string): Promise<void> {
        const command = new DeleteObjectCommand({
            Bucket: this.bucket,
            Key: key,
        })

        try {
            await this.s3Client.send(command)
            this.logger.log(`File deleted: ${key}`)
        } catch (error) {
            this.logger.error(`Failed to delete file: ${key}`, error)
            // 删除失败不抛出异常，避免影响主流程
        }
    }

    /**
     * 确保 Bucket 存在（仅 MinIO 开发环境需要）
     */
    async ensureBucket(): Promise<void> {
        if (!isDevelopment) return // 生产环境由运维确保

        try {
            // 检查 bucket 是否存在
            try {
                await this.s3Client.send(new HeadBucketCommand({ Bucket: this.bucket }))
                this.logger.log(`Bucket "${this.bucket}" already exists`)
                return
            } catch {
                // Bucket 不存在，创建它
            }

            // 创建 bucket
            await this.s3Client.send(new CreateBucketCommand({ Bucket: this.bucket }))
            this.logger.log(`Bucket "${this.bucket}" created`)

            // 设置公开读取策略（开发环境方便调试）
            const policy = {
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: 'Allow',
                        Principal: { AWS: ['*'] },
                        Action: ['s3:GetObject'],
                        Resource: [`arn:aws:s3:::${this.bucket}/*`],
                    },
                ],
            }

            await this.s3Client.send(
                new PutBucketPolicyCommand({
                    Bucket: this.bucket,
                    Policy: JSON.stringify(policy),
                }),
            )
            this.logger.log(`Public read policy set for bucket "${this.bucket}"`)
        } catch (error) {
            this.logger.warn(
                `Failed to ensure bucket exists (MinIO may not be running): ${(error as Error).message}`,
            )
            this.logger.warn(
                'File uploads will fail until MinIO is started. Run: docker-compose up -d minio',
            )
        }
    }
}
