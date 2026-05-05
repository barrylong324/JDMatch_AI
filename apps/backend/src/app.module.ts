import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ThrottlerModule } from '@nestjs/throttler'
import { BullModule } from '@nestjs/bull'
import { DatabaseModule } from './database/database.module'
import { AuthModule } from './modules/auth/auth.module'
import { UsersModule } from './modules/users/users.module'
import { DocumentsModule } from './modules/documents/documents.module'
import { KnowledgeBasesModule } from './modules/knowledge-bases/knowledge-bases.module'
import { ChatModule } from './modules/rag-chat/chat.module'
import { AigcNormalModule } from './modules/aigc-normal/aigc-normal.module'
import { UploadsModule } from './modules/uploads/uploads.module'
import { DocumentProcessingProcessor } from './processors/document.processor'
import { HealthController } from './health.controller'
import { config, getRateLimitTtl, getRateLimitMax } from '@rag-ai/config'

@Module({
    imports: [
        // Configuration
        ConfigModule.forRoot({
            isGlobal: true,
        }),

        // Rate limiting
        ThrottlerModule.forRoot([
            {
                ttl: getRateLimitTtl() * 1000,
                limit: getRateLimitMax(),
            },
        ]),

        // Task queue
        BullModule.forRoot({
            redis: config.REDIS_URL,
        }),

        // Database
        DatabaseModule,

        // Feature modules
        AuthModule,
        UsersModule,
        DocumentsModule,
        KnowledgeBasesModule,
        ChatModule,
        AigcNormalModule,
        UploadsModule,
    ],
    controllers: [HealthController],
    providers: [DocumentProcessingProcessor],
})
export class AppModule {}
