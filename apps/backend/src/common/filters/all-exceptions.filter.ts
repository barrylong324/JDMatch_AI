import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common'
import { Request, Response } from 'express'
import { Prisma } from '@jd-match/database'

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp()
        const response = ctx.getResponse<Response>()
        const request = ctx.getRequest<Request>()

        // 确定 HTTP 状态码
        let status = HttpStatus.INTERNAL_SERVER_ERROR
        let message = '服务器内部错误'

        if (exception instanceof HttpException) {
            status = exception.getStatus()
            const exceptionResponse = exception.getResponse()

            if (typeof exceptionResponse === 'string') {
                message = exceptionResponse
            } else if (exceptionResponse && typeof exceptionResponse === 'object') {
                const resp = exceptionResponse as any
                message = resp.message || resp.error || '服务器内部错误'
                if (Array.isArray(message)) {
                    message = message.join('; ')
                }
            }
        } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
            // Prisma 已知错误（如唯一约束冲突、外键约束等）
            status = HttpStatus.BAD_REQUEST
            switch (exception.code) {
                case 'P2002':
                    message = '数据已存在，请勿重复提交'
                    break
                case 'P2025':
                    message = '请求的记录不存在'
                    break
                case 'P2003':
                    message = '数据关联错误，请检查关联信息'
                    break
                case 'P2014':
                    message = '数据关系冲突，请检查关联数据'
                    break
                default:
                    message = '数据库操作异常，请稍后再试'
            }
            console.error(
                `[Prisma] ${exception.code} ${request.method} ${request.url}:`,
                exception.message.substring(0, 200),
            )
        } else if (exception instanceof Prisma.PrismaClientValidationError) {
            // Prisma 查询参数校验错误
            status = HttpStatus.BAD_REQUEST
            message = '请求参数有误，请检查后重试'
            console.error(
                `[Prisma Validation] ${request.method} ${request.url}:`,
                exception.message.substring(0, 200),
            )
        } else if (exception instanceof Prisma.PrismaClientInitializationError) {
            // Prisma 数据库连接错误
            status = HttpStatus.SERVICE_UNAVAILABLE
            message = '数据库连接异常，请稍后再试'
            console.error(
                `[Prisma Init] ${request.method} ${request.url}:`,
                exception.message.substring(0, 200),
            )
        } else if (exception instanceof Prisma.PrismaClientRustPanicError) {
            // Prisma 底层引擎崩溃
            status = HttpStatus.INTERNAL_SERVER_ERROR
            message = '服务器内部异常，请稍后再试'
            console.error(`[Prisma Panic] ${request.method} ${request.url}`)
        } else if (exception instanceof Error) {
            // 普通 Error：截断过长的 message，避免泄露内部信息
            const rawMessage = exception.message || ''
            // 截取前 100 字符，防止 SQL 查询等长字符串泄露
            const shortMessage =
                rawMessage.length > 100 ? rawMessage.substring(0, 100) + '...' : rawMessage
            console.error(`[${status}] ${request.method} ${request.url}:`, shortMessage)
            // 生产环境不返回原始错误消息
            if (process.env.NODE_ENV === 'production') {
                message = '服务器内部错误'
            } else {
                message = shortMessage
            }
        }

        // 确保 message 始终是字符串
        if (typeof message !== 'string') {
            message = String(message)
        }
        // 最终兜底：message 过长时截断
        if (message.length > 500) {
            message = message.substring(0, 500) + '...'
        }

        response.status(status).json({
            code: status,
            message,
            result: null,
        })
    }
}
