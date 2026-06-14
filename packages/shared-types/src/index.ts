// ============================================
// API Response Types
// ============================================

export class ResponseDto<T> {
    code: number
    message: string
    result: T
    constructor(code: number, message: string, data: T) {
        this.code = code
        this.message = message
        this.result = data
    }
}

export interface ApiResponse<T = any> {
    success: boolean
    data?: T
    error?: ApiError
    meta?: PaginationMeta
}

export interface ApiError {
    code: string
    message: string
    details?: any
}

export interface PaginationMeta {
    page: number
    limit: number
    total: number
    totalPages: number
}

// ============================================
// User Types
// ============================================

export interface UserProfile {
    id: string
    email: string
    name?: string
    image?: string
    role: 'ADMIN' | 'USER' | 'GUEST'
    createdAt: Date
}

// ============================================
// Matching Types (简历-岗位匹配)
// ============================================

export interface MatchingRecord {
    id: string
    userId: string
    position?: string
    status: 'IN_PROGRESS' | 'COMPLETED'
    matchScore?: number
    keywordScore?: number
    skillScore?: number
    experienceScore?: number
    educationScore?: number
    analysis?: string
    startedAt: Date
    completedAt?: Date
    createdAt: Date
    updatedAt: Date
}

export interface MatchingMessage {
    id: string
    matchingId: string
    role: 'USER' | 'ASSISTANT' | 'SYSTEM'
    content: string
    createdAt: Date
}

export interface StartMatchingInput {
    jdUrl: string
}

export interface SendInterviewMessageInput {
    interviewId: string
    content: string
}
