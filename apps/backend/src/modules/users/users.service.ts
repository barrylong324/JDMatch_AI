import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'
import { User } from '@jd-match/database'

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) {}

    async findById(id: string): Promise<User | null> {
        const user = await this.prisma.user.findUnique({
            where: { id },
        })

        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`)
        }

        return user
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { email },
        })
    }

    async findByProvider(provider: string, providerAccountId: string): Promise<User | null> {
        const account = await this.prisma.account.findUnique({
            where: {
                provider_providerAccountId: {
                    provider,
                    providerAccountId,
                },
            },
            include: { user: true },
        })

        return account?.user ?? null
    }

    async create(data: { email: string; password: string; name?: string }): Promise<User> {
        return this.prisma.user.create({
            data: {
                email: data.email.toLowerCase(),
                password: data.password,
                name: data.name,
            },
        })
    }

    async createWithProvider(data: {
        email: string
        name: string
        image?: string | null
        provider: string
        providerAccountId: string
    }): Promise<User> {
        return this.prisma.user.create({
            data: {
                email: data.email.toLowerCase(),
                name: data.name,
                image: data.image,
                accounts: {
                    create: {
                        type: 'oauth',
                        provider: data.provider,
                        providerAccountId: data.providerAccountId,
                    },
                },
            },
        })
    }

    async linkAccount(
        userId: string,
        accountData: {
            provider: string
            providerAccountId: string
        },
    ): Promise<void> {
        await this.prisma.account.create({
            data: {
                userId,
                type: 'oauth',
                provider: accountData.provider,
                providerAccountId: accountData.providerAccountId,
            },
        })
    }

    async update(id: string, data: Partial<User>): Promise<User> {
        await this.findById(id) // Verify user exists

        return this.prisma.user.update({
            where: { id },
            data,
        })
    }

    async delete(id: string): Promise<void> {
        await this.findById(id) // Verify user exists

        await this.prisma.user.update({
            where: { id },
            data: { deletedAt: new Date() },
        })
    }
}
