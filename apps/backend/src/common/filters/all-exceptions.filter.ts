import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common'
import { Request, Response } from 'express'

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp()
        const response = ctx.getResponse<Response>()
        const request = ctx.getRequest<Request>()

        const status =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR

        const exceptionResponse =
            exception instanceof HttpException ? exception.getResponse() : null

        // 提取错误消息：支持 string、HttpException 的 response 对象、以及普通 Error
        let message = '服务器内部错误'
        if (typeof exceptionResponse === 'string') {
            message = exceptionResponse
        } else if (exceptionResponse && typeof exceptionResponse === 'object') {
            const resp = exceptionResponse as any
            message = resp.message || resp.error || '服务器内部错误'
            // NestJS validation pipe 返回数组形式的 message
            if (Array.isArray(message)) {
                message = message.join('; ')
            }
        } else if (exception instanceof Error) {
            message = exception.message
        }

        console.error(`[${status}] ${request.method} ${request.url}:`, message)

        // 统一使用 ResponseDto 格式 { code, message, result }
        response.status(status).json({
            code: status,
            message,
            result: null,
        })
    }
}
