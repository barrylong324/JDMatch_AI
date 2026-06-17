import { Injectable, Logger } from '@nestjs/common'
import axios from 'axios'
import * as cheerio from 'cheerio'

/**
 * JD（岗位描述）链接抓取服务
 * 从常见招聘网站抓取岗位描述内容
 */
@Injectable()
export class JdFetcherService {
    private readonly logger = new Logger(JdFetcherService.name)

    // 支持的招聘网站域名列表
    private readonly supportedDomains = [
        'zhipin.com', // Boss 直聘
        'lagou.com', // 拉勾
        'liepin.com', // 猎聘
        '51job.com', // 前程无忧
        'zhaopin.com', // 智联招聘
        'maimai.cn', // 脉脉
        'linkedin.com', // LinkedIn
        'indeed.com', // Indeed
    ]

    /**
     * 检测输入是 URL 还是普通文本
     */
    isUrl(input: string): boolean {
        const trimmed = input.trim()
        try {
            const url = new URL(trimmed)
            return url.protocol === 'http:' || url.protocol === 'https:'
        } catch {
            return false
        }
    }

    /**
     * 或取 JD 内容：如果是 URL 则抓取，如果是文本则直接返回
     */
    async fetchJdContent(input: string): Promise<{
        content: string
        source: 'url' | 'text'
        url?: string
    }> {
        const trimmed = input.trim()

        if (this.isUrl(trimmed)) {
            const content = await this.fetchFromUrl(trimmed)
            return { content, source: 'url', url: trimmed }
        }

        return { content: trimmed, source: 'text' }
    }

    /**
     * 从 URL 抓取 JD 内容
     */
    private async fetchFromUrl(url: string): Promise<string> {
        this.logger.log(`Fetching JD from URL: ${url}`)

        try {
            const response = await axios.get(url, {
                timeout: 15000,
                headers: {
                    'User-Agent':
                        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
                },
                maxRedirects: 5,
            })

            const html = response.data as string
            const text = this.extractTextFromHtml(html, url)

            if (!text || text.length < 50) {
                this.logger.warn(`Extracted text too short from ${url}, using raw response`)
                // 如果提取的文本太短，可能页面是 SPA，返回原始 HTML 的前部分
                return this.stripHtmlTags(html).substring(0, 8000)
            }

            this.logger.log(`JD fetched: ${text.length} characters from ${url}`)
            return text
        } catch (error) {
            const errMsg = (error as any)?.message || 'Unknown error'
            this.logger.error(`Failed to fetch JD from ${url}: ${errMsg}`)

            // 网络错误时，将 URL 本身作为内容传给 AI，让 AI 尝试处理
            throw new Error(
                `无法获取岗位描述链接内容（${errMsg}）。请确认链接可访问，或直接粘贴岗位描述文本。`,
            )
        }
    }

    /**
     * 从 HTML 中提取纯文本内容
     * 简单实现，后续可用 cheerio 增强
     */
    private extractTextFromHtml(html: string, url: string): string {
        // 优先尝试针对特定网站的提取逻辑
        if (url.includes('zhipin.com')) {
            return this.extractBossZhipin(html)
        }

        if (url.includes('lagou.com')) {
            return this.extractLagou(html)
        }

        // 通用提取：去掉 script/style 标签，提取 body 文本
        return this.genericExtract(html)
    }

    /**
     * Boss 直聘页面提取
     */
    private extractBossZhipin(html: string): string {
        const $ = cheerio.load(html)

        // Boss直聘的 JD 通常在 job-sec-text 或 job-detail 相关 class 中
        const selectors = [
            '.job-sec-text',
            '.job-detail',
            '.detail-content',
            '.job-main',
            '[class*="job-description"]',
            '[class*="job_detail"]',
            '.text',
        ]

        for (const selector of selectors) {
            const text = $(selector).text()?.trim()
            if (text && text.length > 100) {
                return text
            }
        }

        // 回退：提取所有可见文本
        return this.genericExtract(html)
    }

    /**
     * 拉勾页面提取
     */
    private extractLagou(html: string): string {
        const $ = cheerio.load(html)

        const selectors = ['.job-detail', '.job_desc', '[class*="job-description"]', '.detail']

        for (const selector of selectors) {
            const text = $(selector).text()?.trim()
            if (text && text.length > 100) {
                return text
            }
        }

        return this.genericExtract(html)
    }

    /**
     * 通用 HTML 文本提取
     */
    private genericExtract(html: string): string {
        // 去掉 script 和 style 标签
        let text = html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')

        return this.stripHtmlTags(text)
    }

    /**
     * 去除 HTML 标签，保留纯文本
     */
    private stripHtmlTags(html: string): string {
        return html
            .replace(/<[^>]+>/g, ' ') // 去除标签
            .replace(/&nbsp;/g, ' ') // 替换 &nbsp;
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#x27;/g, "'")
            .replace(/&#(\d+);/g, ' ')
            .replace(/\s+/g, ' ') // 合并空白
            .replace(/\n\s*\n/g, '\n\n') // 合并空行
            .trim()
    }
}
