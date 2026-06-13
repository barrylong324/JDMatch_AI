import { HumanMessage, SystemMessage, BaseMessage } from '@langchain/core/messages'
import { config } from '@rag-ai/config'
import { ChatDeepSeek } from '@langchain/deepseek'

// 初始化 ChatDeepSeek 实例
const client = new ChatDeepSeek({
    apiKey: config.OPENAI_API_KEY,
    model: 'deepseek-chat',
    configuration: {
        baseURL: 'https://api.deepseek.com/v1',
    },
    temperature: 0.7,
    maxRetries: 2,
} as any)

// 封装一个异步函数来处理对话请求
export async function askDeepSeek(prompt: string) {
    try {
        const messages: BaseMessage[] = [
            new SystemMessage('你需要什么帮助呢？'),
            new HumanMessage(prompt),
        ]
        const response = await client.invoke(messages as any)
        return (response as any).content
    } catch (error) {
        console.error('调用 DeepSeek API 时发生错误:', error)
        throw new Error('无法处理您的请求，请稍后再试。')
    }
}

/**
 * 流式调用 DeepSeek，逐个返回 token
 * 用法: for await (const token of askDeepSeekStream(prompt)) { ... }
 */
export async function* askDeepSeekStream(prompt: string): AsyncGenerator<string, void, unknown> {
    try {
        const messages: BaseMessage[] = [
            new SystemMessage('你需要什么帮助呢？'),
            new HumanMessage(prompt),
        ]
        const stream = await client.stream(messages as any)
        for await (const chunk of stream) {
            const content = (chunk as any).content
            if (content) {
                yield content
            }
        }
    } catch (error) {
        console.error('调用 DeepSeek 流式 API 时发生错误:', error)
        throw new Error('无法处理您的请求，请稍后再试。')
    }
}
