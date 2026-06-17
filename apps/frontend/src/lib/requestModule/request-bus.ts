// 为请求绑定业务层，接入内部协议规范和接口文档，向外提供业务接口api
import service from '@/lib/requestModule/request-base'

// 1.auth模块
interface LoginOrRegister {
    email: string
    password: string
    name?: string
}
// 登录
export const contextRagLogin = (email: string, password: string) => {
    const param: LoginOrRegister = {
        email,
        password,
    } as LoginOrRegister
    return service({
        url: '/auth/login',
        method: 'post',
        data: param,
    })
}
// 注册
export const contextRagRegister = (email: string, password: string, name?: string) => {
    const param: LoginOrRegister = {
        email,
        password,
        name,
    } as LoginOrRegister
    return service({
        url: '/auth/register',
        method: 'post',
        data: param,
    })
}

// 2.user模块
// 获取当前用户
export const getUserData = () => {
    return service({
        url: '/users/me',
        method: 'get',
    })
}

// 获取当前用户id获取用户
export const getUserById = (params: string) => {
    return service({
        url: '/users',
        method: 'get',
        params,
    })
}

// 3.matching模块
// 上传简历并匹配岗位
export const uploadResumeAndMatch = (formData: FormData) => {
    return service({
        url: '/matching/analyze',
        method: 'post',
        data: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
    })
}

/**
 * SSE 流式匹配分析 — 返回异步生成器
 * 用法: for await (const chunk of streamMatching(formData)) { ... }
 */
export async function* streamMatching(
    formData: FormData,
): AsyncGenerator<SSEDataChunk, void, unknown> {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

    const response = await fetch(`${API_BASE_URL}/matching/analyze/stream`, {
        method: 'POST',
        headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
    })

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('Stream not supported')

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed || !trimmed.startsWith('data: ')) continue

            const dataStr = trimmed.slice(6)
            if (dataStr === '[DONE]') return

            try {
                const chunk: SSEDataChunk = JSON.parse(dataStr)
                yield chunk
                if (chunk.type === 'error') return
            } catch {
                // 忽略解析失败的行
            }
        }
    }
}

/** SSE 数据块类型（与后端 SSEChunk 对应） */
export interface SSEDataChunk {
    type: 'meta' | 'token' | 'error' | 'done'
    content?: string
    matchingId?: string
    messageId?: string
}

// 获取所有匹配记录（分页）
export const getMatchingAllMessage = (page = 1, limit = 10) => {
    return service({
        url: '/matching/conversations',
        method: 'get',
        params: { page, limit },
    })
}

// 获取匹配详情
export const getMatchingById = (matchingId: string) => {
    return service({
        url: `/matching/conversations/${matchingId}`,
        method: 'get',
    })
}

// 删除匹配记录
export const delMatchingMessage = (matchingId: string) => {
    return service({
        url: `/matching/conversations/${matchingId}`,
        method: 'delete',
    })
}

// ============================================
// 4. AI Chat 模块 —— 简历优化/分析 AI 助手
// ============================================

/** AI 对话 SSE 数据块类型 */
export interface AiChatSSEChunk {
    type: 'content' | 'done' | 'error'
    content?: string
    conversationId?: string
    messageId?: string
    error?: string
}

/**
 * 普通对话（非流式）
 */
export const sendAiChatMessage = (message: string, conversationId?: string) => {
    return service({
        url: '/ai-chat/chat',
        method: 'post',
        data: { message, conversationId },
    })
}

/**
 * SSE 流式对话 —— 返回异步生成器
 * 用法: for await (const chunk of streamAiChat("你好")) { ... }
 */
export async function* streamAiChat(
    message: string,
    conversationId?: string,
): AsyncGenerator<AiChatSSEChunk, void, unknown> {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

    const response = await fetch(`${API_BASE_URL}/ai-chat/chat/stream`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message, conversationId }),
    })

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('流式响应不支持')

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed || !trimmed.startsWith('data: ')) continue

            const dataStr = trimmed.slice(6)
            try {
                const chunk: AiChatSSEChunk = JSON.parse(dataStr)
                yield chunk
                if (chunk.type === 'error') return
            } catch {
                // 忽略解析失败的行
            }
        }
    }
}

/**
 * 获取 AI 对话列表
 */
export const getAiChatConversations = (page = 1, limit = 20) => {
    return service({
        url: '/ai-chat/conversations',
        method: 'get',
        params: { page, limit },
    })
}

/**
 * 获取 AI 对话消息
 */
export const getAiChatMessages = (conversationId: string) => {
    return service({
        url: `/ai-chat/conversations/${conversationId}`,
        method: 'get',
    })
}

/**
 * 删除 AI 对话
 */
export const deleteAiChatConversation = (conversationId: string) => {
    return service({
        url: `/ai-chat/conversations/${conversationId}`,
        method: 'delete',
    })
}
