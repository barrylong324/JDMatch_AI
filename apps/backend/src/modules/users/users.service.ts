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

    async create(data: { email: string; password: string; name?: string }): Promise<User> {
        return this.prisma.user.create({
            data: {
                email: data.email.toLowerCase(),
                password: data.password,
                name: data.name,
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
