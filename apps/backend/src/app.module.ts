import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ThrottlerModule } from '@nestjs/throttler'
import { DatabaseModule } from './database/database.module'
import { AuthModule } from './modules/auth/auth.module'
import { UsersModule } from './modules/users/users.module'
import { MatchingModule } from './modules/matching/matching.module'
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
    ],
    providers: [],
})
export class AppModule {}
