'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Bot, Send, Sparkles, Trash2, Plus, MessageSquare, Loader2, Pencil, Copy, RefreshCw, Check, X, Image as ImageIcon, Paperclip } from 'lucide-react';
import { streamAiChat, getAiChatConversations, deleteAiChatConversation, getAiChatMessages, getAiChatUsage } from '@/lib/requestModule/request-bus';
import type { AiChatSSEChunk, ModelUsageInfo } from '@/lib/requestModule/request-bus';
import { toast } from 'sonner';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    createdAt?: string;
}

interface Conversation {
    id: string;
    title: string;
    lastMessage: string;
    updatedAt: string;
}

export default function AiAssistantPage() {
    const t = useTranslations('aiAssistant');
    const common = useTranslations('common');

    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [conversationId, setConversationId] = useState<string | undefined>();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [showSidebar, setShowSidebar] = useState(true);
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    const [showAttachMenu, setShowAttachMenu] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [model, setModel] = useState<'flash' | 'pro'>('flash');
    const [usage, setUsage] = useState<ModelUsageInfo | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const editInputRef = useRef<HTMLTextAreaElement>(null);
    const attachMenuRef = useRef<HTMLDivElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const isUserScrolledUpRef = useRef(false);

    const SCROLL_THRESHOLD = 120; // 距离底部小于此像素时自动滚动

    // 检测用户是否上滑
    const handleScroll = useCallback(() => {
        const el = messagesContainerRef.current;
        if (!el) return;
        const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
        isUserScrolledUpRef.current = distFromBottom > SCROLL_THRESHOLD;
    }, []);

    // 绑定滚动监听
    useEffect(() => {
        const el = messagesContainerRef.current;
        if (!el) return;
        el.addEventListener('scroll', handleScroll, { passive: true });
        return () => el.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

    // 仅当用户在底部附近时自动滚动
    const scrollToBottom = useCallback(() => {
        if (!isUserScrolledUpRef.current) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // 新对话或切换对话时强制滚到底部
    useEffect(() => {
        isUserScrolledUpRef.current = false;
        scrollToBottom();
    }, [conversationId, scrollToBottom]);

    // 加载对话列表
    useEffect(() => {
        loadConversations();
        loadUsage();
    }, []);

    // 模型切换时刷新用量
    useEffect(() => {
        loadUsage();
    }, [model]);

    const loadConversations = async () => {
        try {
            setLoadingHistory(true);
            const res = await getAiChatConversations(1, 50);
            setConversations(res?.data?.result?.conversations || []);
        } catch {
            // 静默失败
        } finally {
            setLoadingHistory(false);
        }
    };

    const loadUsage = async () => {
        try {
            const res = await getAiChatUsage();
            if (res?.data?.result) {
                setUsage(res.data.result);
            }
        } catch {
            // 静默失败
        }
    };

    // 加载指定对话的消息
    const loadConversation = async (convId: string) => {
        try {
            const res = await getAiChatMessages(convId);
            const msgs = res?.data?.result?.messages || [];
            setMessages(
                msgs.map((m: any) => ({
                    id: m.id,
                    role: m.role === 'USER' ? 'user' : 'assistant',
                    content: m.content,
                    createdAt: m.createdAt,
                })),
            );
            setConversationId(convId);
        } catch {
            toast.error(common('error'));
        }
    };

    // 删除对话
    const handleDeleteConversation = (convId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setConfirmDeleteId(convId);
    };

    const handleConfirmDelete = async () => {
        if (!confirmDeleteId) return;
        const convId = confirmDeleteId;
        setDeletingId(convId);
        setConfirmDeleteId(null);
        try {
            await deleteAiChatConversation(convId);
            toast.success(common('success'));
            if (conversationId === convId) {
                handleNewChat();
            }
            loadConversations();
        } catch {
            toast.error(common('error'));
        } finally {
            setDeletingId(null);
        }
    };

    // 新建对话
    const handleNewChat = () => {
        setMessages([]);
        setConversationId(undefined);
        setInput('');
        inputRef.current?.focus();
    };

    // 发送消息（SSE 流式）
    const handleSend = async () => {
        const trimmed = input.trim();
        if (!trimmed || isStreaming) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: trimmed,
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsStreaming(true);

        // 添加一个占位的 assistant 消息用于流式更新
        const assistantMsgId = (Date.now() + 1).toString();
        setMessages((prev) => [
            ...prev,
            { id: assistantMsgId, role: 'assistant', content: '' },
        ]);

        try {
            let fullContent = '';
            for await (const chunk of streamAiChat(trimmed, conversationId, model)) {
                if (chunk.type === 'content' && chunk.content) {
                    fullContent += chunk.content;
                    setMessages((prev) =>
                        prev.map((m) =>
                            m.id === assistantMsgId ? { ...m, content: fullContent } : m,
                        ),
                    );
                }

                if (chunk.type === 'done') {
                    if (chunk.conversationId && !conversationId) {
                        setConversationId(chunk.conversationId);
                        loadConversations();
                    }
                    // 刷新用量
                    loadUsage();
                }

                if (chunk.type === 'error') {
                    toast.error(chunk.error || t('streamError'));
                    setMessages((prev) =>
                        prev.map((m) =>
                            m.id === assistantMsgId
                                ? { ...m, content: fullContent || t('error') }
                                : m,
                        ),
                    );
                    break;
                }
            }
        } catch (error: any) {
            toast.error(error.message || t('streamError'));
            setMessages((prev) =>
                prev.map((m) =>
                    m.id === assistantMsgId
                        ? { ...m, content: m.content || t('error') }
                        : m,
                ),
            );
        } finally {
            setIsStreaming(false);
            loadUsage();
        }
    };

    // 键盘发送
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // 点击建议问题
    const handleSuggestion = (question: string) => {
        setInput(question);
        setTimeout(() => handleSend(), 100);
    };

    // 复制消息内容
    const handleCopy = async (content: string) => {
        try {
            await navigator.clipboard.writeText(content);
            toast.success('已复制到剪贴板');
        } catch {
            toast.error('复制失败');
        }
    };

    // 开始编辑消息
    const handleStartEdit = (msg: Message) => {
        setEditingMessageId(msg.id);
        setEditContent(msg.content);
        setTimeout(() => editInputRef.current?.focus(), 50);
    };

    // 保存编辑并重新发送
    const handleSaveEdit = async () => {
        const trimmed = editContent.trim();
        if (!trimmed || !editingMessageId) return;

        // 找到编辑消息在列表中的位置，移除它及其后续消息
        const editIndex = messages.findIndex((m) => m.id === editingMessageId);
        if (editIndex === -1) return;

        // 保留编辑位置之前的所有消息
        const keptMessages = messages.slice(0, editIndex);

        // 更新被编辑的消息内容
        const editedMsg = { ...messages[editIndex], content: trimmed };
        keptMessages.push(editedMsg);

        setMessages(keptMessages);
        setEditingMessageId(null);
        setEditContent('');
        setIsStreaming(true);

        // 重新发送
        const assistantMsgId = (Date.now() + 1).toString();
        setMessages((prev) => [
            ...prev,
            { id: assistantMsgId, role: 'assistant', content: '' },
        ]);

        try {
            let fullContent = '';
            for await (const chunk of streamAiChat(trimmed, conversationId, model)) {
                if (chunk.type === 'content' && chunk.content) {
                    fullContent += chunk.content;
                    setMessages((prev) =>
                        prev.map((m) =>
                            m.id === assistantMsgId ? { ...m, content: fullContent } : m,
                        ),
                    );
                }
                if (chunk.type === 'error') {
                    toast.error(chunk.error || t('streamError'));
                    setMessages((prev) =>
                        prev.map((m) =>
                            m.id === assistantMsgId
                                ? { ...m, content: fullContent || t('error') }
                                : m,
                        ),
                    );
                    break;
                }
            }
        } catch (error: any) {
            toast.error(error.message || t('streamError'));
        } finally {
            setIsStreaming(false);
            loadUsage();
        }
    };

    // 取消编辑
    const handleCancelEdit = () => {
        setEditingMessageId(null);
        setEditContent('');
    };

    // 重试：移除最后一条 AI 回复，重新发送上一条用户消息
    const handleRetry = async (assistantMsgId: string | string) => {
        if (isStreaming) return;

        // 找到这条 AI 消息在列表中的位置
        const aiIndex = messages.findIndex((m) => m.id === assistantMsgId);
        if (aiIndex <= 0) return;

        // 找到它前面的用户消息
        const userMsg = messages[aiIndex - 1];
        if (userMsg.role !== 'user') return;

        // 移除当前 AI 回复
        const keptMessages = messages.slice(0, aiIndex);
        setMessages(keptMessages);
        setIsStreaming(true);

        const newAssistantId = (Date.now() + 1).toString();
        setMessages((prev) => [
            ...prev,
            { id: newAssistantId, role: 'assistant', content: '' },
        ]);

        try {
            let fullContent = '';
            for await (const chunk of streamAiChat(userMsg.content, conversationId, model)) {
                if (chunk.type === 'content' && chunk.content) {
                    fullContent += chunk.content;
                    setMessages((prev) =>
                        prev.map((m) =>
                            m.id === newAssistantId ? { ...m, content: fullContent } : m,
                        ),
                    );
                }
                if (chunk.type === 'error') {
                    toast.error(chunk.error || t('streamError'));
                    setMessages((prev) =>
                        prev.map((m) =>
                            m.id === newAssistantId
                                ? { ...m, content: fullContent || t('error') }
                                : m,
                        ),
                    );
                    break;
                }
            }
        } catch (error: any) {
            toast.error(error.message || t('streamError'));
        } finally {
            setIsStreaming(false);
            loadUsage();
        }
    };

    // 关闭附件菜单（点击外部）
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (attachMenuRef.current && !attachMenuRef.current.contains(e.target as Node)) {
                setShowAttachMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // 附件上传（预留接口）
    const handleAttachImage = () => {
        setShowAttachMenu(false);
        toast('图片上传功能即将开放，敬请期待', {
            style: { background: '#1a1a1a', color: '#fff', border: '1px solid #333' },
        });
    };

    const handleAttachFile = () => {
        setShowAttachMenu(false);
        toast('文件上传功能即将开放，敬请期待', {
            style: { background: '#1a1a1a', color: '#fff', border: '1px solid #333' },
        });
    };

    const suggestions = [
        { key: 'resume', text: t('suggestions.resume') },
        { key: 'match', text: t('suggestions.match') },
        { key: 'skill', text: t('suggestions.skill') },
        { key: 'interview', text: t('suggestions.interview') },
    ];

    return (
        <div className="flex h-full max-h-[calc(100vh-80px)]">
            {/* 左侧对话列表 (可折叠) */}
            {showSidebar && (
                <div className="w-64 border-r border-gray-200 flex flex-col bg-gray-50 flex-shrink-0">
                    <div className="p-4 border-b border-gray-200">
                        <button
                            onClick={handleNewChat}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            {t('newChat')}
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2">
                        <h3 className="px-2 mb-2 text-xs font-semibold text-gray-500 uppercase">
                            {t('history')}
                        </h3>

                        {loadingHistory ? (
                            <div className="flex justify-center py-4">
                                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                            </div>
                        ) : conversations.length === 0 ? (
                            <p className="px-2 py-4 text-sm text-gray-400 text-center">
                                {t('noConversations')}
                            </p>
                        ) : (
                            conversations.map((conv) => (
                                <div
                                    key={conv.id}
                                    onClick={() => loadConversation(conv.id)}
                                    className={`group flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer text-sm transition-colors ${conversationId === conv.id
                                        ? 'bg-gray-200 text-gray-900'
                                        : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                >
                                    <MessageSquare className="w-4 h-4 flex-shrink-0" />
                                    <span className="flex-1 truncate">
                                        {conv.title || t('untitled')}
                                    </span>
                                    <button
                                        onClick={(e) => handleDeleteConversation(conv.id, e)}
                                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-300 transition-all"
                                    >
                                        <Trash2 className="w-3 h-3 text-gray-400" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* 右侧聊天区域 */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* 顶部标题栏 */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-black flex items-center justify-center">
                            <Bot className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-semibold text-gray-900">
                                {t('title')}
                            </h1>
                            <p className="text-xs text-gray-500">{t('description')}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* 模型选择器 */}
                        <select
                            value={model}
                            onChange={(e) => setModel(e.target.value as 'flash' | 'pro')}
                            className="text-xs border border-gray-300 rounded-lg px-3 py-1.5 bg-white text-gray-700 cursor-pointer hover:border-gray-400"
                        >
                            <option value="flash">⚡ Flash（免费 100 次）</option>
                            <option value="pro">🧠 Pro（免费 20 次）</option>
                        </select>
                        {/* 用量条 */}
                        {usage && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all ${usage[model].used >= usage[model].limit ? 'bg-red-500' : 'bg-black'
                                            }`}
                                        style={{ width: `${Math.min((usage[model].used / usage[model].limit) * 100, 100)}%` }}
                                    />
                                </div>
                                <span className="whitespace-nowrap tabular-nums">
                                    {usage[model].used}/{usage[model].limit}
                                </span>
                            </div>
                        )}
                        <button
                            onClick={() => setShowSidebar(!showSidebar)}
                            className="text-sm text-gray-400 hover:text-gray-600"
                        >
                            {showSidebar ? '隐藏历史' : '显示历史'}
                        </button>
                    </div>
                </div>

                {/* 消息区域 */}
                <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-6 py-6">
                    {messages.length === 0 ? (
                        // 欢迎界面
                        <div className="flex flex-col items-center justify-center h-full">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center mb-6">
                                <Sparkles className="w-8 h-8 text-white" />
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-2">
                                {t('title')}
                            </h2>
                            <p className="text-gray-500 text-center max-w-md mb-8">
                                {t('welcome')}
                            </p>
                            <div className="grid grid-cols-2 gap-3 max-w-lg w-full">
                                {suggestions.map((s) => (
                                    <button
                                        key={s.key}
                                        onClick={() => handleSuggestion(s.text)}
                                        className="text-left px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition-all"
                                    >
                                        {s.text}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        // 对话消息
                        <div className="max-w-3xl mx-auto space-y-6">
                            {messages.map((msg) => (
                                <div key={msg.id}>
                                    <div
                                        className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''
                                            }`}
                                    >
                                        {msg.role === 'assistant' && (
                                            <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <Bot className="w-4 h-4 text-white" />
                                            </div>
                                        )}

                                        <div
                                            className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === 'user'
                                                ? 'bg-black text-white rounded-br-md'
                                                : 'bg-gray-100 text-gray-900 rounded-bl-md'
                                                }`}
                                        >
                                            {editingMessageId === msg.id ? (
                                                // 编辑模式
                                                <div className="flex flex-col gap-2">
                                                    <textarea
                                                        ref={editInputRef}
                                                        value={editContent}
                                                        onChange={(e) => setEditContent(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                                e.preventDefault();
                                                                handleSaveEdit();
                                                            }
                                                            if (e.key === 'Escape') {
                                                                handleCancelEdit();
                                                            }
                                                        }}
                                                        className="w-full bg-transparent border-none outline-none resize-none text-sm text-white placeholder-gray-400 min-w-[200px]"
                                                        rows={2}
                                                    />
                                                    <div className="flex items-center gap-1 justify-end">
                                                        <button
                                                            onClick={handleSaveEdit}
                                                            className="p-1 rounded hover:bg-white/20 transition-colors"
                                                        >
                                                            <Check className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={handleCancelEdit}
                                                            className="p-1 rounded hover:bg-white/20 transition-colors"
                                                        >
                                                            <X className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : msg.content ? (
                                                <div className="text-sm whitespace-pre-wrap leading-relaxed">
                                                    {msg.content}
                                                    {msg.role === 'assistant' &&
                                                        isStreaming &&
                                                        msg.id === messages[messages.length - 1]?.id && (
                                                            <span className="inline-block w-1.5 h-4 bg-gray-400 animate-pulse ml-0.5 align-middle" />
                                                        )}
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-gray-400 text-sm">
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    {t('thinking')}
                                                </div>
                                            )}
                                        </div>

                                        {msg.role === 'user' && (
                                            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <span className="text-xs font-medium text-gray-600">
                                                    U
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* 操作按钮行 */}
                                    {msg.content && !isStreaming && editingMessageId !== msg.id && (
                                        <div
                                            className={`flex gap-1 mt-1 ${msg.role === 'user' ? 'justify-end mr-11' : 'ml-11'
                                                }`}
                                        >
                                            {msg.role === 'user' && (
                                                <>
                                                    <button
                                                        onClick={() => handleCopy(msg.content)}
                                                        className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                                                        title="复制"
                                                    >
                                                        <Copy className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleStartEdit(msg)}
                                                        className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                                                        title="编辑"
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </button>
                                                </>
                                            )}
                                            {msg.role === 'assistant' && (
                                                <>
                                                    <button
                                                        onClick={() => handleCopy(msg.content)}
                                                        className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                                                        title="复制"
                                                    >
                                                        <Copy className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleRetry(msg.id)}
                                                        className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                                                        title="重新生成"
                                                    >
                                                        <RefreshCw className="w-3.5 h-3.5" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>

                {/* 输入区域 */}
                <div className="border-t border-gray-200 bg-white px-6 py-4">
                    <div className="max-w-3xl mx-auto">
                        <div className="relative flex items-end gap-3 bg-gray-100 rounded-2xl px-4 py-3 border border-gray-200 focus-within:border-gray-400 focus-within:bg-white transition-all">
                            {/* 附件添加按钮 */}
                            <div className="relative flex-shrink-0" ref={attachMenuRef}>
                                <button
                                    onClick={() => setShowAttachMenu(!showAttachMenu)}
                                    className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
                                    title="添加附件"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                                {showAttachMenu && (
                                    <div className="absolute bottom-full left-0 mb-2 w-36 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50">
                                        <button
                                            onClick={handleAttachImage}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                        >
                                            <ImageIcon className="w-4 h-4 text-gray-400" />
                                            图片
                                        </button>
                                        <button
                                            onClick={handleAttachFile}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                        >
                                            <Paperclip className="w-4 h-4 text-gray-400" />
                                            文件
                                        </button>
                                    </div>
                                )}
                            </div>
                            <textarea
                                ref={inputRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={t('inputPlaceholder')}
                                rows={1}
                                className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-gray-900 placeholder-gray-400 max-h-32"
                                disabled={isStreaming}
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || isStreaming}
                                className="flex-shrink-0 w-9 h-9 rounded-lg bg-black text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
                            >
                                {isStreaming ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Send className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                        <p className="text-xs text-gray-400 text-center mt-2">
                            JDMatch AI 助手 · 专注简历优化与岗位匹配
                        </p>
                    </div>
                </div>
            </div>

            {/* 删除确认弹窗 */}
            {confirmDeleteId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setConfirmDeleteId(null)}
                    />
                    <div className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4 z-10">
                        <h3 className="text-lg font-semibold text-black mb-2">
                            确认删除
                        </h3>
                        <p className="text-gray-600 mb-6">
                            {t('deleteConfirm')}
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setConfirmDeleteId(null)}
                                disabled={!!deletingId}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                            >
                                {common('cancel')}
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                disabled={!!deletingId}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                            >
                                {deletingId ? common('loading') : common('delete')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
