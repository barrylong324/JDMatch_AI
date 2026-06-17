import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class RegisterDto {
    @ApiProperty({ example: 'user@example.com' })
    @IsEmail()
    @IsNotEmpty()
    email: string

    @ApiProperty({ example: 'password123', minLength: 6 })
    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    password: string

    @ApiProperty({ example: 'John Doe', required: false })
    @IsString()
    @IsOptional()
    name?: string

    @ApiProperty({ description: '验证码ID' })
    @IsString()
    @IsNotEmpty()
    captchaId: string

    @ApiProperty({ description: '用户输入的验证码' })
    @IsString()
    @IsNotEmpty()
    captcha: string
}
