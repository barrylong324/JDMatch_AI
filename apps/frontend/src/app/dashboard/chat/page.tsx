'use client';

import { useEffect, useState, useRef } from 'react';
import { Send, Bot, User as UserIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { getRagChatMessage, getAllKnowledgeBases } from '@/lib/requestModule/request-bus'
import { SendMessageDto } from '@rag-ai/shared-types'

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    createdAt: string;
}

interface KnowledgeBase {
    id: string;
    name: string;
}

export default function ChatPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
    const [selectedKB, setSelectedKB] = useState<string>('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadKnowledgeBases();
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    };

    const loadKnowledgeBases = async () => {
        try {
            const response = await getAllKnowledgeBases()
            const { code, message, result } = response.data
            if (code === 0) {
                setKnowledgeBases(result)
                if (result.length > 0) {
                    setSelectedKB(result[0].id)
                }
            }

        } catch (error) {
            console.error('Failed to load knowledge bases:', error)
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !selectedKB || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages((prev) => [
            ...prev,
            {
                id: Date.now().toString(),
                role: 'user',
                content: userMessage,
                createdAt: new Date().toISOString(),
            },
        ]);
        setIsLoading(true);

        try {
            const params: SendMessageDto = {
                content: userMessage,
                kbId: selectedKB
            } as SendMessageDto
            const response = await getRagChatMessage(params)
            const { code, message, result } = response.data
            if (code === 0) {
                const assistantMessage = result.answer || result.content
                setMessages((prev) => [
                    ...prev,
                    {
                        id: (Date.now() + 1).toString(),
                        role: 'assistant',
                        content: assistantMessage,
                        createdAt: new Date().toISOString(),
                    },
                ])
            }
        } catch (error: any) {
            setMessages((prev) => [
                ...prev,
                {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: '抱歉，我遇到了一个错误，请再试一次。',
                    createdAt: new Date().toISOString(),
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)]">
            <div className="mb-4">
                <h1 className="text-3xl font-bold text-black">AI Rag Chat</h1>
                <p className="mt-1 text-sm text-gray-600">使用AI与您的知识库聊天</p>
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    选择知识库
                </label>
                <select
                    value={selectedKB}
                    onChange={(e) => setSelectedKB(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-black focus:border-black"
                >
                    <option value="">选择一个知识库...</option>
                    {knowledgeBases.map((kb) => (
                        <option key={kb.id} value={kb.id}>
                            {kb.name}
                        </option>
                    ))}
                </select>
            </div>

            <Card className="flex-1 overflow-hidden flex flex-col border-gray-200">
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
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
                                                <div className="prose prose-sm max-w-none">
                                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                        {message.content}
                                                    </ReactMarkdown>
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
                    {isLoading && (
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
                            placeholder="RAG知识库，尽管问..."
                            disabled={!selectedKB || isLoading}
                            className="flex-1"
                        />
                        <Button
                            type="submit"
                            disabled={!input.trim() || !selectedKB || isLoading}
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
