import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { MatchingService } from './matching.service'
import { MatchingController } from './matching.controller'
import { MatchingPreviewController } from './matching-preview.controller'

@Module({
    imports: [
        JwtModule.register({
            secret: process.env.NEXTAUTH_SECRET || 'dev-secret',
            signOptions: { expiresIn: '1h' },
        }),
    ],
    providers: [MatchingService],
    controllers: [MatchingController, MatchingPreviewController],
    exports: [MatchingService],
})
export class MatchingModule {}
