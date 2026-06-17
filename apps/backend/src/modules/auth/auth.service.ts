import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcryptjs'
import { UsersService } from '../users/users.service'
import { config } from '@jd-match/config'
import type { GitHubUserProfile } from './strategies/github.strategy'

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
    ) {}

    async validateUser(email: string, password: string): Promise<any> {
        const user = await this.usersService.findByEmail(email)

        if (!user || !user.password) {
            throw new UnauthorizedException('Invalid credentials')
        }

        const isPasswordValid = await bcrypt.compare(password, user.password)

        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials')
        }

        const { password: _, ...result } = user
        return result
    }

    async login(user: any) {
        const payload = {
            email: user.email,
            sub: user.id,
            role: user.role,
        }

        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
        }
    }

    /**
     * GitHub OAuth 登录：查找或创建用户，返回 JWT
     */
    async loginWithGitHub(profile: GitHubUserProfile) {
        // 尝试通过 provider + providerId 查找已有账户关联
        let user = await this.usersService.findByProvider(profile.provider, profile.providerId)

        if (!user && profile.email) {
            // 没找到 provider 关联，尝试通过 email 查找
            user = await this.usersService.findByEmail(profile.email)
            if (user) {
                // 用户已存在，关联 GitHub 账户
                await this.usersService.linkAccount(user.id, {
                    provider: profile.provider,
                    providerAccountId: profile.providerId,
                })
            }
        }

        if (!user) {
            // 创建新用户
            user = await this.usersService.createWithProvider({
                email: profile.email ?? `${profile.providerId}@github.user`,
                name: profile.name,
                image: profile.avatar,
                provider: profile.provider,
                providerAccountId: profile.providerId,
            })
        }

        return this.login(user)
    }

    async register(userData: { email: string; password: string; name?: string }) {
        // Check if user already exists
        const existingUser = await this.usersService.findByEmail(userData.email)
        if (existingUser) {
            throw new UnauthorizedException('Email already registered')
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(userData.password, 10)

        // Create user
        const user = await this.usersService.create({
            email: userData.email,
            password: hashedPassword,
            name: userData.name,
        })

        // Return JWT token
        return this.login(user)
    }

    generateAccessToken(userId: string, email: string, role: string) {
        const payload = { sub: userId, email, role }
        return this.jwtService.sign(payload, {
            expiresIn: config.JWT_ACCESS_TOKEN_EXPIRES_IN,
        })
    }
}
