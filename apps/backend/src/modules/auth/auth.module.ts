import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { CaptchaService } from './captcha.service'
import { UsersModule } from '../users/users.module'
import { JwtStrategy } from './strategies/jwt.strategy'
import { GitHubOAuthStrategy } from './strategies/github.strategy'
import { config } from '@jd-match/config'

@Module({
    imports: [
        UsersModule,
        PassportModule,
        JwtModule.register({
            secret: config.NEXTAUTH_SECRET,
            signOptions: { expiresIn: config.JWT_ACCESS_TOKEN_EXPIRES_IN },
        }),
    ],
    providers: [AuthService, CaptchaService, JwtStrategy, GitHubOAuthStrategy],
    controllers: [AuthController],
    exports: [AuthService],
})
export class AuthModule {}
