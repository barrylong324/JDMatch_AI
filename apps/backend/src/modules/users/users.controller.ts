import { Controller, Get, Param, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { UsersService } from './users.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Get('me')
    @ApiOperation({ summary: 'Get current user profile' })
    async getCurrentUser() {
        // Will be implemented with request user from JWT
        return { message: 'Get current user endpoint' }
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get user by ID' })
    async getUserById(@Param('id') id: string) {
        return this.usersService.findById(id)
    }
}
