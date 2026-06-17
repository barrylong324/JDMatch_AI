import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface User {
    id: string
    email: string
    name: string
    role: string
}

interface AuthState {
    user: User | null
    token: string | null
    isAuthenticated: boolean
    login: (user: User, token: string) => void
    logout: () => void
    // 初始化时从 localStorage 恢复状态
    initialize: () => void
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,

            // 初始化方法：从 localStorage 恢复认证状态
            initialize: () => {
                const token = localStorage.getItem('token')
                if (token && !get().isAuthenticated) {
                    set({
                        token,
                        isAuthenticated: true,
                        // 注意：这里不恢复 user，因为刷新后需要从后端重新获取
                        // 如果需要完整的用户信息，可以调用一个 refresh 接口
                    })
                }
            },

            login: (user, token) => {
                localStorage.setItem('token', token)
                set({ user, token, isAuthenticated: true })
            },

            logout: () => {
                localStorage.removeItem('token')
                set({ user: null, token: null, isAuthenticated: false })
            },
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => localStorage),
        },
    ),
)
