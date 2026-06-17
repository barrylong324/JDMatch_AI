import { Module, Global, OnModuleInit, Logger } from '@nestjs/common'
import { S3Service } from './s3.service'
import { FileUploadService } from './file-upload.service'
import { DocumentParserService } from './document-parser.service'
import { JdFetcherService } from './jd-fetcher.service'

@Global()
@Module({
    providers: [S3Service, FileUploadService, DocumentParserService, JdFetcherService],
    exports: [S3Service, FileUploadService, DocumentParserService, JdFetcherService],
})
export class StorageModule implements OnModuleInit {
    private readonly logger = new Logger(StorageModule.name)

    constructor(private readonly s3Service: S3Service) {}

    async onModuleInit() {
        // 开发环境自动创建 Bucket
        await this.s3Service.ensureBucket()
        this.logger.log('Storage module initialized')
    }
}
