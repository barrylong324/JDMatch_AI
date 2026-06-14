import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcryptjs'
import { UsersService } from '../users/users.service'
import { config } from '@jd-match/config'

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
