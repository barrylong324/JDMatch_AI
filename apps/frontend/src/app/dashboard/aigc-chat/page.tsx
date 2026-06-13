'use client';

import { useEffect, useState, useRef, useCallback } from 'react'
import { Send, Bot, User as UserIcon, Copy, Check } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { streamAigcNormalChat } from '@/lib/requestModule/request-bus'

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    createdAt: string;
}

/** 距离底部多少 px 以内视为"在底部"，允许自动滚动 */
const AUTO_SCROLL_THRESHOLD = 80;
/** 流式内容刷新到 state 的最小间隔 (ms)，防止高频渲染闪烁 */
const STREAM_FLUSH_INTERVAL = 50;

export default function AIGCChatPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    /** 用 ref 跟踪当前流式助手消息 ID，避免闭包问题 */
    const streamingMsgIdRef = useRef<string | null>(null);
    /** 用户是否在底部（允许自动滚动） */
    const isNearBottomRef = useRef(true);
    /** 流式内容缓冲区，避免每个 token 都触发 setState */
    const streamBufferRef = useRef('');
    /** 上次刷新 state 的时间戳 */
    const lastFlushTimeRef = useRef(0);
    /** RAF 定时器 ID */
    const rafIdRef = useRef<number | null>(null);

    // ---- 智能滚动逻辑 ----

    /** 检查当前是否在底部附近 */
    const checkNearBottom = useCallback(() => {
        const el = chatContainerRef.current;
        if (!el) return;
        const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
        isNearBottomRef.current = distFromBottom < AUTO_SCROLL_THRESHOLD;
    }, []);

    /** 容器滚动事件：持续更新 isNearBottom */
    const handleScroll = useCallback(() => {
        checkNearBottom();
    }, [checkNearBottom]);

    /** 仅在用户处于底部时才自动滚动（流式期间用 instant 避免抖动） */
    const smartScrollToBottom = useCallback((smooth = false) => {
        if (isNearBottomRef.current) {
            messagesEndRef.current?.scrollIntoView({
                behavior: smooth ? 'smooth' : 'auto',
            });
        }
    }, []);

    // ---- 流式内容批量刷新 ----

    /** 将缓冲区内容刷入 state，并触发智能滚动 */
    const flushStreamContent = useCallback(() => {
        const content = streamBufferRef.current;
        if (!content && lastFlushTimeRef.current > 0) return; // 没新内容不刷新
        setMessages((prev) =>
            prev.map((msg) =>
                msg.id === streamingMsgIdRef.current
                    ? { ...msg, content }
                    : msg,
            ),
        );
        lastFlushTimeRef.current = Date.now();
        // RAF 确保 DOM 更新后再判断滚动
        if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = requestAnimationFrame(() => {
            smartScrollToBottom(false);
            rafIdRef.current = null;
        });
    }, [smartScrollToBottom]);

    // 组件卸载时清理
    useEffect(() => {
        return () => {
            if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
        };
    }, []);

    // ---- 发送消息 ----

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        const userMsgId = Date.now().toString();
        const assistantMsgId = (Date.now() + 1).toString();
        streamingMsgIdRef.current = assistantMsgId;
        streamBufferRef.current = '';
        lastFlushTimeRef.current = 0;

        setMessages((prev) => [
            ...prev,
            {
                id: userMsgId,
                role: 'user',
                content: userMessage,
                createdAt: new Date().toISOString(),
            },
            {
                id: assistantMsgId,
                role: 'assistant',
                content: '',
                createdAt: new Date().toISOString(),
            },
        ]);
        setIsLoading(true);

        // 用户发消息后强制滚到底部
        isNearBottomRef.current = true;
        requestAnimationFrame(() => smartScrollToBottom(true));

        try {
            for await (const chunk of streamAigcNormalChat(userMessage)) {
                if (chunk.type === 'token' && chunk.content) {
                    streamBufferRef.current += chunk.content;
                    const elapsed = Date.now() - lastFlushTimeRef.current;
                    if (elapsed >= STREAM_FLUSH_INTERVAL) {
                        flushStreamContent();
                    }
                } else if (chunk.type === 'error') {
                    streamBufferRef.current = chunk.content || '抱歉，响应出错了。';
                    flushStreamContent();
                    break;
                }
            }
            // 循环结束后刷出剩余内容
            flushStreamContent();
        } catch (error: any) {
            streamBufferRef.current = '抱歉，我遇到了一个错误，请再试一次。';
            flushStreamContent();
        } finally {
            setIsLoading(false);
            streamingMsgIdRef.current = null;
            streamBufferRef.current = '';
        }
    };

    // ---- 代码块复制按钮 ----
    const CopyCodeButton = ({ code }: { code: string }) => {
        const [copied, setCopied] = useState(false);
        const handleCopy = useCallback(async () => {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }, [code]);
        return (
            <button onClick={handleCopy} className="copy-btn" title="复制代码">
                {copied ? (
                    <><Check className="h-3.5 w-3.5" /> 已复制</>
                ) : (
                    <><Copy className="h-3.5 w-3.5" /> 复制</>
                )}
            </button>
        );
    };

    // ---- ReactMarkdown 自定义渲染组件 ----
    const markdownComponents = {
        // 代码块：深色背景 + 语法高亮 + 语言标签 + 复制按钮
        pre: ({ children }: any) => {
            const childProps = children?.props || {};
            const className = childProps.className || '';
            const langMatch = className.match(/language-(\w+)/);
            const language = langMatch ? langMatch[1] : 'text';
            const code = String(childProps.children || '').replace(/\n$/, '');

            return (
                <div className="code-block-wrapper">
                    <div className="code-block-header">
                        <span className="lang-label">{language}</span>
                        <CopyCodeButton code={code} />
                    </div>
                    <div className="code-block-body">
                        <SyntaxHighlighter
                            language={language}
                            style={oneDark}
                            PreTag="div"
                            customStyle={{
                                margin: 0,
                                padding: '1rem',
                                background: 'transparent',
                                fontSize: '0.875rem',
                                lineHeight: '1.6',
                            }}
                            codeTagProps={{
                                style: {
                                    fontFamily: "'SF Mono', 'Fira Code', 'Fira Mono', Menlo, Consolas, monospace",
                                },
                            }}
                        >
                            {code}
                        </SyntaxHighlighter>
                    </div>
                </div>
            );
        },
        // 代码：行内代码保持原样
        code: ({ children, className, ...rest }: any) => {
            const isInline = !className;
            if (isInline) {
                return <code {...rest}>{children}</code>;
            }
            // 代码块交给 pre 组件处理
            return <code className={className} {...rest}>{children}</code>;
        },
        // 表格：滚动容器包裹
        table: ({ children }: any) => (
            <div className="table-wrapper">
                <table>{children}</table>
            </div>
        ),
    };

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)]">
            <div className="mb-4">
                <h1 className="text-3xl font-bold text-center">Contexta  AI  Chat</h1>
            </div>

            <Card className="flex-1 overflow-hidden flex flex-col border-gray-200">
                <div
                    ref={chatContainerRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto p-4 space-y-4 bg-white"
                >
                    {messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-gray-400">
                            <div className="text-center">
                                <Bot className="mx-auto h-12 w-12 mb-4" />
                                <p>通过在下面输入消息开始对话</p>
                            </div>
                        </div>
                    ) : (
                        messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-lg px-4 py-2 ${message.role === 'user'
                                        ? 'bg-black text-white'
                                        : 'bg-gray-100 text-gray-900'
                                        }`}
                                >
                                    <div className="flex items-start space-x-2">
                                        {message.role === 'assistant' && (
                                            <Bot className="h-5 w-5 mt-0.5 flex-shrink-0" />
                                        )}
                                        <div className="flex-1">
                                            {message.role === 'user' ? (
                                                <p className="text-sm whitespace-pre-wrap">
                                                    {message.content}
                                                </p>
                                            ) : (
                                                <div className="chat-markdown">
                                                    {message.content ? (
                                                        <ReactMarkdown
                                                            remarkPlugins={[remarkGfm]}
                                                            components={markdownComponents}
                                                        >
                                                            {message.content}
                                                        </ReactMarkdown>
                                                    ) : (
                                                        <span className="inline-block w-2 h-4 bg-gray-400 animate-pulse" />
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        {message.role === 'user' && (
                                            <UserIcon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                    {isLoading && !streamingMsgIdRef.current && (
                        <div className="flex justify-start">
                            <div className="bg-gray-100 rounded-lg px-4 py-2">
                                <div className="flex space-x-2">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                    <div
                                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                        style={{ animationDelay: '0.1s' }}
                                    ></div>
                                    <div
                                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                        style={{ animationDelay: '0.2s' }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSend} className="border-t border-gray-200 p-4 bg-white">
                    <div className="flex space-x-4">
                        <Input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="随便问..."
                            className="flex-1"
                        />
                        <Button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            className="bg-black text-white hover:bg-gray-800"
                        >
                            <Send className="h-5 w-5" />
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}
