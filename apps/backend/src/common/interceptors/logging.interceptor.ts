import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'

/** HTTP 方法对应的成功消息映射 */
const SUCCESS_MESSAGES: Record<string, string> = {
    GET: '查询成功',
    POST: '创建成功',
    PUT: '更新成功',
    PATCH: '更新成功',
    DELETE: '删除成功',
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest()
        const response = context.switchToHttp().getResponse()
        const method = request.method
        const url = request.url
        const now = Date.now()

        return next.handle().pipe(
            map((data) => {
                const responseTime = Date.now() - now
                console.log(`${method} ${url} - ${responseTime}ms`)

                // 如果控制器已经返回了 ResponseDto 格式（含 code 和 result），则透传
                if (data && typeof data === 'object' && 'code' in data && 'result' in data) {
                    return data
                }

                // 自动包装统一响应格式 { code, message, result }
                // 所有 2xx 成功响应的 code 统一为 0，前端用 code === 0 判断成功
                return {
                    code: 0,
                    message: SUCCESS_MESSAGES[method] || '操作成功',
                    result: data,
                }
            }),
        )
    }
}
