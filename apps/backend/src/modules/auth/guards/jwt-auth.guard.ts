import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

/**
 * JWT 认证守卫
 *
 * 流程：
 * 1. 从请求头 Authorization: Bearer <token> 提取 JWT
 * 2. 由 JwtStrategy 校验 token 有效性（签名、过期时间）
 * 3. 校验通过后，将解析出的用户信息挂载到 request.user 上
 * 4. 校验失败时，抛出 UnauthorizedException，交全局异常过滤器统一格式化返回
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    /**
     * 自定义认证结果处理
     *
     * @param err    - 验证过程中抛出的异常（如 token 格式错误）
     * @param user   - 验证成功时返回的用户对象 { userId, email, role }，失败时为 null/false
     * @param info   - passport-jwt 附加信息（token 过期时包含过期原因）
     * @param context - NestJS 执行上下文
     * @returns 认证通过的 user 对象
     * @throws  UnauthorizedException 认证失败时，携带中文提示信息
     */
    handleRequest<TUser = any>(
        err: any,
        user: TUser | false | null,
        info: any,
        context: ExecutionContext,
    ): TUser {
        // 情况1：验证过程抛出异常（如签名不匹配）
        if (err) {
            throw err instanceof UnauthorizedException
                ? err
                : new UnauthorizedException('Token 验证失败，请重新登录')
        }

        // 情况2：token 已过期（passport-jwt 会将过期信息放入 info）
        if (info && info.name === 'TokenExpiredError') {
            throw new UnauthorizedException('登录已过期，请重新登录')
        }
        if (info && info.message === 'jwt expired') {
            throw new UnauthorizedException('登录已过期，请重新登录')
        }

        // 情况3：无 token 或 token 无效（user 为 null 或 false）
        if (!user) {
            throw new UnauthorizedException('请先登录后再访问')
        }

        // 认证通过，返回用户信息
        return user
    }
}
