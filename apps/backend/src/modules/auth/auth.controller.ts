import {
    Controller,
    Post,
    Get,
    Body,
    Query,
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
import { config, getCorsOrigins } from '@jd-match/config'

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
     * 前端跳转到此地址，附带 redirect 参数（发起登录的前端页面 URL），
     * 后端将其编码进 OAuth state，回调成功后原路跳回该域名
     */
    @Get('github')
    @ApiOperation({ summary: 'Initiate GitHub OAuth login' })
    async githubAuth(@Query('redirect') redirect: string | undefined, @Res() res: Response) {
        if (!config.GITHUB_CLIENT_ID || !config.GITHUB_CALLBACK_URL) {
            throw new BadRequestException('GitHub OAuth 未配置')
        }

        // 把发起登录的前端页面地址编码进 state（base64url JSON）
        const state = Buffer.from(JSON.stringify({ redirect: redirect ?? '' })).toString(
            'base64url',
        )

        const authorizeUrl = new URL('https://github.com/login/oauth/authorize')
        authorizeUrl.searchParams.set('client_id', config.GITHUB_CLIENT_ID)
        authorizeUrl.searchParams.set('redirect_uri', config.GITHUB_CALLBACK_URL)
        authorizeUrl.searchParams.set('scope', 'user:email')
        authorizeUrl.searchParams.set('state', state)

        res.redirect(authorizeUrl.toString())
    }

    /**
     * GitHub OAuth 回调
     * GitHub 授权后回调到此地址，后端生成 JWT 并重定向回发起登录的前端域名
     */
    @Get('github/callback')
    @UseGuards(AuthGuard('github'))
    @ApiOperation({ summary: 'GitHub OAuth callback' })
    async githubAuthCallback(@Req() req: Request, @Res() res: Response) {
        const profile = req.user as GitHubUserProfile

        try {
            const result = await this.authService.loginWithGitHub(profile)

            // 优先跳回发起登录的域名（OAuth state 携带），否则回退默认前端地址
            const redirectUrl = this.resolveGitHubRedirectUrl(req)
            redirectUrl.searchParams.set('token', result.access_token)
            redirectUrl.searchParams.set('name', result.user.name ?? '')
            redirectUrl.searchParams.set('email', result.user.email ?? '')

            res.redirect(redirectUrl.toString())
        } catch (error) {
            // 登录失败，重定向到发起登录的域名并附带错误信息
            const redirectUrl = this.resolveGitHubRedirectUrl(req)
            redirectUrl.searchParams.set('error', 'github_auth_failed')
            res.redirect(redirectUrl.toString())
        }
    }

    /**
     * 从 OAuth state 中解析并校验要跳回的前端地址
     * 只允许跳回 CORS 白名单（CORS_ORIGINS / NEXT_PUBLIC_APP_URL）内的域名，防止开放重定向漏洞
     */
    private resolveGitHubRedirectUrl(req: Request): URL {
        const fallback = new URL('/en/login', config.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')

        try {
            const rawState = req.query.state
            if (typeof rawState !== 'string' || !rawState) return fallback

            const parsed = JSON.parse(Buffer.from(rawState, 'base64url').toString('utf8'))
            const target: unknown = parsed?.redirect
            if (typeof target !== 'string' || !target) return fallback

            const url = new URL(target)
            const originAllowed = getCorsOrigins().some(
                (origin) => typeof origin === 'string' && origin === url.origin,
            )
            return originAllowed ? url : fallback
        } catch {
            return fallback
        }
    }
}
