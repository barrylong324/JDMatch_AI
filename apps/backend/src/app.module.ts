import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ThrottlerModule } from '@nestjs/throttler'
import { DatabaseModule } from './database/database.module'
import { AuthModule } from './modules/auth/auth.module'
import { UsersModule } from './modules/users/users.module'
import { MatchingModule } from './modules/matching/matching.module'
import { AiChatModule } from './modules/ai-chat/ai-chat.module'
import { HealthController } from './health.controller'
import { config, getRateLimitTtl, getRateLimitMax } from '@jd-match/config'

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

        // Database
        DatabaseModule,

        // Feature modules
        AuthModule,
        UsersModule,
        MatchingModule,
        AiChatModule,
    ],
    providers: [],
    controllers: [HealthController],
})
export class AppModule {}
