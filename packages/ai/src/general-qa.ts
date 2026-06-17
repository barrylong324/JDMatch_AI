import { HumanMessage, SystemMessage, BaseMessage } from '@langchain/core/messages'
import { tool } from '@langchain/core/tools'
import { config } from '@jd-match/config'
import { ChatDeepSeek } from '@langchain/deepseek'
import { z } from 'zod'

// ============================================
// 系统提示词 —— 简历-岗位匹配分析专用智能体
// ============================================
const SYSTEM_PROMPT = `你是一个专注于**简历优化**和**岗位匹配分析**的AI助手。你只回答与以下主题相关的问题：

- 简历撰写、修改和优化
- 岗位匹配度分析（技能、经验、学历、关键词等维度）
- 职业规划与发展建议
- 职场沟通与专业技能提升
- 招聘市场趋势与岗位要求解读

如果用户提出的问题与以上主题无关（例如：通用知识问答、编程、数学、娱乐、新闻、翻译、闲聊等），
你**必须**调用 reject_unrelated_topic 工具来礼貌地拒绝回答，并引导用户回到简历与岗位匹配相关话题。

对于简历/岗位匹配相关的专业问题，请直接给出详细、专业的回答。
请始终使用与用户相同的语言回复。`

// ============================================
// 工具定义：拒绝无关问题
// ============================================
const rejectUnrelatedTopic = tool(
    async ({ politeMessage }) => {
        // 该函数体不会被真正执行；LLM 通过 tool_call 来表达拒绝意图
        // 实际返回值由 extractRejectionMessage 从 tool_call.args 中提取
        return politeMessage
    },
    {
        name: 'reject_unrelated_topic',
        description:
            '当用户问题与简历、面试、职业规划等完全无关时，调用此工具礼貌拒绝，并引导用户提出面试相关话题。严禁在工具参数中回答用户原本的问题。',
        schema: z.object({
            politeMessage: z
                .string()
                .describe(
                    '一段礼貌的中文回复，说明本助手专注于模拟面试与简历优化，引导用户提出相关话题',
                ),
        }),
    },
)

// ============================================
// 初始化 ChatDeepSeek 实例
// ============================================
const baseClient = new ChatDeepSeek({
    apiKey: config.OPENAI_API_KEY,
    model: 'deepseek-v4-flash',
    configuration: {
        baseURL: 'https://api.deepseek.com/v1',
    },
    temperature: 0.7,
    maxRetries: 2,
} as any)

// 绑定工具：让 LLM 可以在不相关时调用 reject 工具
const clientWithTools = (baseClient as any).bindTools([rejectUnrelatedTopic])

// ============================================
// 辅助函数：从 LLM 响应中提取拒绝消息
// ============================================
function extractRejectionMessage(response: any): string | null {
    const toolCalls = response?.tool_calls
    if (toolCalls && toolCalls.length > 0) {
        for (const call of toolCalls) {
            if (call.name === 'reject_unrelated_topic') {
                return (
                    call.args?.politeMessage ||
                    '抱歉，我是面试模拟专用助手，只能回答与简历和面试相关的问题。请提出相关话题，我很乐意帮助您！'
                )
            }
        }
    }
    return null
}

// ============================================
// 封装异步函数处理对话请求（带工具调用守卫）
// ============================================
export async function askDeepSeek(prompt: string) {
    try {
        const messages: BaseMessage[] = [new SystemMessage(SYSTEM_PROMPT), new HumanMessage(prompt)]
        const response = await clientWithTools.invoke(messages as any)

        // 检查 LLM 是否调用了拒绝工具
        const rejection = extractRejectionMessage(response)
        if (rejection) {
            return rejection
        }

        return (response as any).content
    } catch (error) {
        console.error('调用 DeepSeek API 时发生错误:', error)
        throw new Error('无法处理您的请求，请稍后再试。')
    }
}

// ============================================
// 流式调用（带工具调用守卫）
// ============================================
export async function* askDeepSeekStream(prompt: string): AsyncGenerator<string, void, unknown> {
    try {
        const messages: BaseMessage[] = [new SystemMessage(SYSTEM_PROMPT), new HumanMessage(prompt)]
        const stream = await clientWithTools.stream(messages as any)

        // 用于累积流式传输中的 tool_call 片段
        const accumulatedToolCalls: Map<number, { name: string; args: string }> = new Map()
        let hasContent = false

        for await (const chunk of stream) {
            const c = chunk as any

            // 累积 tool_call_chunks（工具调用以分片形式到达）
            if (c.tool_call_chunks && c.tool_call_chunks.length > 0) {
                for (const tc of c.tool_call_chunks) {
                    const idx = tc.index ?? 0
                    if (!accumulatedToolCalls.has(idx)) {
                        accumulatedToolCalls.set(idx, { name: '', args: '' })
                    }
                    const acc = accumulatedToolCalls.get(idx)!
                    if (tc.name) acc.name += tc.name
                    if (tc.args) acc.args += tc.args
                }
                continue // 工具调用片段不作为普通内容输出
            }

            // 正常输出文本内容
            if (c.content) {
                hasContent = true
                yield c.content
            }
        }

        // 流结束后：如果 LLM 调用了拒绝工具且没有输出正常内容，则返回拒绝消息
        if (!hasContent && accumulatedToolCalls.size > 0) {
            for (const [, tc] of accumulatedToolCalls) {
                if (tc.name === 'reject_unrelated_topic') {
                    try {
                        const args = JSON.parse(tc.args)
                        yield args.politeMessage ||
                            '抱歉，我是面试模拟专用助手，只能回答与简历和面试相关的问题。请提出相关话题，我很乐意帮助您！'
                    } catch {
                        yield '抱歉，我是面试模拟专用助手，只能回答与简历和面试相关的问题。请提出相关话题，我很乐意帮助您！'
                    }
                    return
                }
            }
        }
    } catch (error) {
        console.error('调用 DeepSeek 流式 API 时发生错误:', error)
        throw new Error('无法处理您的请求，请稍后再试。')
    }
}
