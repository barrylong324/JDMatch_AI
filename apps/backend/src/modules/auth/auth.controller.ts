import {
    Controller,
    Post,
    Get,
    Body,
    HttpCode,
    HttpStatus,
    Res,
    Req,
    UseGuards,
    BadRequestException,
} from '@nestjs/common'
import { ApiTags, ApiOperation } from '@nestjs/swagger'
import { AuthGuard } from '@nestjs/passport'
import type { Response, Request } from 'express'
import { AuthService } from './auth.service'
import { CaptchaService } from './captcha.service'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'
import type { GitHubUserProfile } from './strategies/github.strategy'
import { config } from '@jd-match/config'

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly captchaService: CaptchaService,
    ) {}

    /**
     * 获取登录验证码（SVG 图片 + captchaId）
     */
    @Get('captcha')
    @ApiOperation({ summary: 'Get login captcha SVG' })
    getCaptcha() {
        return this.captchaService.generate()
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Login with email and password' })
    async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
        // 先校验验证码
        const captchaValid = this.captchaService.validate(loginDto.captchaId, loginDto.captcha)
        if (!captchaValid) {
            throw new BadRequestException('验证码错误或已过期')
        }

        const user = await this.authService.validateUser(loginDto.email, loginDto.password)
        const result = await this.authService.login(user)

        // Set token in response header for easy access in browser DevTools
        res.setHeader('Authorization', `Bearer ${result.access_token}`)
        res.setHeader('Access-Control-Expose-Headers', 'Authorization')

        return result
    }

    @Post('register')
    @ApiOperation({ summary: 'Register a new user' })
    async register(@Body() registerDto: RegisterDto) {
        // 先校验验证码
        const captchaValid = this.captchaService.validate(
            registerDto.captchaId,
            registerDto.captcha,
        )
        if (!captchaValid) {
            throw new BadRequestException('验证码错误或已过期')
        }
        return this.authService.register(registerDto)
    }

    /**
     * 发起 GitHub OAuth 登录
     * 前端跳转到此地址，后端重定向到 GitHub 授权页
     */
    @Get('github')
    @UseGuards(AuthGuard('github'))
    @ApiOperation({ summary: 'Initiate GitHub OAuth login' })
    async githubAuth() {
        // Guard 会自动重定向到 GitHub，这里不会执行
    }

    /**
     * GitHub OAuth 回调
     * GitHub 授权后回调到此地址，后端生成 JWT 并重定向到前端
     */
    @Get('github/callback')
    @UseGuards(AuthGuard('github'))
    @ApiOperation({ summary: 'GitHub OAuth callback' })
    async githubAuthCallback(@Req() req: Request, @Res() res: Response) {
        const profile = req.user as GitHubUserProfile

        try {
            const result = await this.authService.loginWithGitHub(profile)

            // 重定向到前端，附带 token 和用户信息
            const frontendUrl = config.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
            const redirectUrl = new URL('/en/login', frontendUrl)
            redirectUrl.searchParams.set('token', result.access_token)
            redirectUrl.searchParams.set('name', result.user.name ?? '')
            redirectUrl.searchParams.set('email', result.user.email ?? '')

            res.redirect(redirectUrl.toString())
        } catch (error) {
            // 登录失败，重定向到前端登录页并附带错误信息
            const frontendUrl = config.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
            const redirectUrl = new URL('/en/login', frontendUrl)
            redirectUrl.searchParams.set('error', 'github_auth_failed')
            res.redirect(redirectUrl.toString())
        }
    }
}
