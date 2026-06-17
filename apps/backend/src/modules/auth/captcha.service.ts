import { Injectable } from '@nestjs/common'
import { randomInt } from 'crypto'

interface CaptchaEntry {
    code: string
    expiresAt: number
}

/**
 * SVG 验证码服务
 * - 生成4位字母数字验证码
 * - 使用内存存储，5分钟过期
 * - SVG 包含干扰线和噪点
 */
@Injectable()
export class CaptchaService {
    // 内存存储 captchaId -> { code, expiresAt }
    private store = new Map<string, CaptchaEntry>()

    // 每60秒清理一次过期条目
    private cleanupInterval: ReturnType<typeof setInterval>

    // 验证码有效期 5 分钟
    private readonly TTL_MS = 5 * 60 * 1000

    // 字符集（排除易混淆字符：0/O、1/I/l）
    private readonly CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

    constructor() {
        this.cleanupInterval = setInterval(() => this.cleanup(), 60_000)
    }

    /** 生成验证码 */
    generate(): { captchaId: string; svg: string } {
        const captchaId = this.generateId()
        const code = this.generateCode(4)

        this.store.set(captchaId, {
            code,
            expiresAt: Date.now() + this.TTL_MS,
        })

        const svg = this.renderSvg(code)
        return { captchaId, svg }
    }

    /** 校验验证码，校验后立即删除（一次性使用） */
    validate(captchaId: string, userInput: string): boolean {
        const entry = this.store.get(captchaId)
        if (!entry) return false

        // 校验后立即删除，防止重复使用
        this.store.delete(captchaId)

        if (Date.now() > entry.expiresAt) return false

        return entry.code.toLowerCase() === userInput.toLowerCase()
    }

    // ---- private ----

    private generateId(): string {
        const timestamp = Date.now().toString(36)
        const random = randomInt(0, 0xffffffff).toString(36)
        return `${timestamp}-${random}`
    }

    private generateCode(length: number): string {
        const chars = this.CHARSET
        let code = ''
        for (let i = 0; i < length; i++) {
            code += chars[randomInt(0, chars.length)]
        }
        return code
    }

    /** 渲染 SVG 验证码图片 */
    private renderSvg(code: string): string {
        const width = 120
        const height = 44
        const fontSize = 28

        // 干扰线
        let lines = ''
        for (let i = 0; i < 3; i++) {
            const x1 = randomInt(0, width)
            const y1 = randomInt(0, height)
            const x2 = randomInt(0, width)
            const y2 = randomInt(0, height)
            const color = this.randomGray(120, 180)
            lines += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1.5" />`
        }

        // 噪点
        let dots = ''
        for (let i = 0; i < 30; i++) {
            const cx = randomInt(0, width)
            const cy = randomInt(0, height)
            const r = (Math.random() * 1.5 + 0.5).toFixed(1)
            const color = this.randomGray(100, 180)
            dots += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" />`
        }

        // 文字（每个字符独立绘制，增加旋转和偏移）
        let textElements = ''
        const charWidth = width / code.length
        for (let i = 0; i < code.length; i++) {
            const x = charWidth * i + charWidth / 2
            const y = height / 2 + fontSize / 3
            const rotate = randomInt(-20, 20)
            const color = this.randomColor()
            textElements += `<text x="${x}" y="${y}" font-size="${fontSize}" font-family="Arial, sans-serif" font-weight="bold" fill="${color}" text-anchor="middle" dominant-baseline="middle" transform="rotate(${rotate}, ${x}, ${y})">${code[i]}</text>`
        }

        return [
            '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 ' +
                width +
                ' ' +
                height +
                '">',
            '<rect width="100%" height="100%" fill="#f5f5f5" rx="4" ry="4" />',
            lines,
            dots,
            textElements,
            '</svg>',
        ].join('')
    }

    private randomGray(min: number, max: number): string {
        const v = randomInt(min, max + 1)
        return `rgb(${v},${v},${v})`
    }

    private randomColor(): string {
        const r = randomInt(20, 120)
        const g = randomInt(20, 120)
        const b = randomInt(20, 120)
        return `rgb(${r},${g},${b})`
    }

    private cleanup(): void {
        const now = Date.now()
        for (const [key, entry] of this.store) {
            if (now > entry.expiresAt) {
                this.store.delete(key)
            }
        }
    }

    onModuleDestroy(): void {
        clearInterval(this.cleanupInterval)
    }
}
