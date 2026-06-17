import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class LoginDto {
    @ApiProperty({ example: 'user@example.com' })
    @IsEmail()
    @IsNotEmpty()
    email: string

    @ApiProperty({ example: 'password123' })
    @IsString()
    @IsNotEmpty()
    password: string

    @ApiProperty({ description: '验证码ID', example: 'm2k3x-abc123' })
    @IsString()
    @IsNotEmpty()
    captchaId: string

    @ApiProperty({ description: '用户输入的验证码', example: 'A3K9' })
    @IsString()
    @IsNotEmpty()
    captcha: string
}
