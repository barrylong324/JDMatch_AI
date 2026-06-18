import { Injectable, Logger } from '@nestjs/common'

// pdfjs-dist v4.x 需要 Promise.withResolvers（Node.js 22+ / ES2024）
// 低版本 Node 兜底 polyfill
if (typeof (Promise as any).withResolvers !== 'function') {
    ;(Promise as any).withResolvers = function () {
        let resolve: any, reject: any
        const promise = new Promise((res, rej) => {
            resolve = res
            reject = rej
        })
        return { promise, resolve, reject }
    }
}

/**
 * 文档解析服务 —— 将 PDF/DOCX 文件解析为纯文本
 * PDF: 使用 pdfjs-dist 官方库
 * DOCX: 使用 mammoth
 */
@Injectable()
export class DocumentParserService {
    private readonly logger = new Logger(DocumentParserService.name)

    /**
     * 解析文档为纯文本
     * @param buffer 文件内容
     * @param mimeType 文件类型
     * @returns 解析后的纯文本
     */
    async parseDocument(buffer: Buffer, mimeType: string): Promise<string> {
        try {
            switch (mimeType) {
                case 'application/pdf':
                    return await this.parsePdf(buffer)
                case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
                    return await this.parseDocx(buffer)
                default:
                    throw new Error(`不支持的文件类型: ${mimeType}`)
            }
        } catch (error) {
            this.logger.error(`Document parsing failed for type: ${mimeType}`, error)
            throw new Error(`文档解析失败: ${(error as Error).message}`)
        }
    }

    /**
     * 解析 PDF 文件（使用 pdfjs-dist）
     */
    private async parsePdf(buffer: Buffer): Promise<string> {
        try {
            // pdfjs-dist v4.x 是 ESM-only，必须用动态 import
            const pdfjsLib = await import('pdfjs-dist')

            // 将 Buffer 转为 Uint8Array（零拷贝，避免复制大文件）
            const uint8Array = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength)
            const loadingTask = pdfjsLib.getDocument({ data: uint8Array })
            const pdf = await loadingTask.promise

            const numPages = pdf.numPages
            const textParts: string[] = []

            for (let pageNum = 1; pageNum <= numPages; pageNum++) {
                const page = await pdf.getPage(pageNum)
                const content = await page.getTextContent()
                const pageText = content.items
                    .map((item: any) => item.str || '')
                    .filter(Boolean)
                    .join(' ')
                if (pageText.trim()) {
                    textParts.push(pageText.trim())
                }
            }

            const text = textParts.join('\n\n').trim()
            this.logger.log(`PDF parsed: ${text.length} characters, ${numPages} pages`)
            return text || '[PDF 文件已解析，但未提取到文本内容]'
        } catch (error) {
            this.logger.error('PDF parsing failed', error)
            throw new Error('PDF 文件解析失败，请确认文件未加密且格式正确')
        }
    }

    /**
     * 解析 DOCX 文件（使用 mammoth）
     */
    private async parseDocx(buffer: Buffer): Promise<string> {
        try {
            const mammoth = require('mammoth')
            const result = await mammoth.extractRawText({ buffer })

            if (result.messages.length > 0) {
                this.logger.warn('DOCX parsing warnings:', JSON.stringify(result.messages))
            }

            const text = result.value?.trim() || ''
            this.logger.log(`DOCX parsed: ${text.length} characters`)
            return text
        } catch (error) {
            this.logger.error('DOCX parsing failed', error)
            throw new Error('DOCX 文件解析失败，请确认文件格式正确')
        }
    }
}
