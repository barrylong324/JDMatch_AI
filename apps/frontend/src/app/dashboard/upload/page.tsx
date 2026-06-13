'use client';

import { useEffect, useState, useCallback } from 'react';
import { Upload as UploadIcon, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getAllKnowledgeBases, getAllDocument, uploadFile } from '@/lib/requestModule/request-bus'

interface KnowledgeBase {
    id: string;
    name: string;
}

interface Document {
    id: string;
    title: string;
    fileName: string;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    createdAt: string;
}

export default function UploadPage() {
    const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
    const [selectedKB, setSelectedKB] = useState<string>('');
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [dragActive, setDragActive] = useState(false);

    // 1. 定义 loadDocuments（接收 kbId 参数）
    const loadDocuments = useCallback(async (kbId: string) => {
        if (!kbId) return
        try {
            const response = await getAllDocument(kbId)
            const { code, message, result } = response.data
            if (code === 0) {
                setDocuments(result)
            } else {
                console.error(message)
            }
        } catch (error) {
            console.error('Failed to load documents:', error)
        }
    }, []) // 依赖为空，因为内部只使用了 setDocuments（稳定）和外部 API

    // 2. 定义 loadKnowledgeBases
    const loadKnowledgeBases = useCallback(async () => {
        try {
            const response = await getAllKnowledgeBases()
            const { code, message, result } = response.data
            if (code === 0) {
                const kbList = result
                setKnowledgeBases(kbList)
                if (kbList.length > 0) {
                    const firstKbId = kbList[0].id
                    setSelectedKB(firstKbId);       // 更新状态（用于其他地方）
                    await loadDocuments(firstKbId)  // 直接调用，不依赖 selectedKB 状态
                }
            } else {
                toast.error(message || 'Failed to load knowledge bases');
            }
        } catch (error) {
            toast.error('Failed to load knowledge bases');
        }
    }, [loadDocuments]) // 依赖 loadDocuments（它被 useCallback 包裹且依赖为空，所以稳定）

    useEffect(() => {
        loadKnowledgeBases()
    }, [loadKnowledgeBases])

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !selectedKB) {
            toast.error('Please select a file and knowledge base');
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('knowledgeBaseId', selectedKB);

        try {
            const response = await uploadFile(formData)
            const { code, message, result } = response.data;
            if (code === 0) {
                toast.success(message)
                setFile(null)
                await loadDocuments(selectedKB)
            } else {
                toast.error(message || 'Failed to load knowledge bases');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return <CheckCircle className="h-5 w-5 text-green-500" />;
            case 'PROCESSING':
                return <Clock className="h-5 w-5 text-yellow-500 animate-spin" />;
            case 'FAILED':
                return <XCircle className="h-5 w-5 text-red-500" />;
            default:
                return <Clock className="h-5 w-5 text-gray-400" />;
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-black">Upload Documents</h1>
                <p className="mt-1 text-sm text-gray-600">
                    Upload PDF, DOCX, HTML, Markdown, or Text files
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upload Form */}
                <Card>
                    <CardContent className="p-6">
                        <form onSubmit={handleUpload} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select Knowledge Base
                                </label>
                                <select
                                    value={selectedKB}
                                    onChange={(e) => setSelectedKB(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-black focus:border-black"
                                >
                                    <option value="">Choose a knowledge base...</option>
                                    {knowledgeBases.map((kb) => (
                                        <option key={kb.id} value={kb.id}>
                                            {kb.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Upload File
                                </label>
                                <div
                                    onDragEnter={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDragOver={handleDrag}
                                    onDrop={handleDrop}
                                    className={`border-2 border-dashed rounded-lg p-8 text-center ${dragActive
                                        ? 'border-black bg-gray-50'
                                        : 'border-gray-300'
                                        }`}
                                >
                                    <input
                                        type="file"
                                        accept=".pdf,.docx,.html,.htm,.md,.txt"
                                        onChange={(e) => e.target.files && setFile(e.target.files[0])}
                                        className="hidden"
                                        id="file-upload"
                                    />
                                    <label htmlFor="file-upload" className="cursor-pointer">
                                        <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                                        <p className="mt-2 text-sm text-gray-600">
                                            Drag and drop your file here, or{' '}
                                            <span className="text-black hover:text-gray-700 underline">
                                                browse
                                            </span>
                                        </p>
                                        <p className="mt-1 text-xs text-gray-500">
                                            PDF, DOCX, HTML, MD, TXT up to 10MB
                                        </p>
                                    </label>
                                </div>
                                {file && (
                                    <div className="mt-2 flex items-center text-sm text-gray-600">
                                        <FileText className="h-4 w-4 mr-2" />
                                        {file.name} ({(file.size / 1024).toFixed(2)} KB)
                                    </div>
                                )}
                            </div>

                            <Button
                                type="submit"
                                disabled={!file || !selectedKB || uploading}
                                className="w-full bg-black text-white hover:bg-gray-800"
                            >
                                {uploading ? 'Uploading...' : 'Upload Document'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Recent Documents */}
                <Card>
                    <CardContent className="p-6">
                        <h3 className="text-lg font-medium text-black mb-4">Recent Documents</h3>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {documents.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-8">
                                    No documents yet
                                </p>
                            ) : (
                                documents.map((doc) => (
                                    <div
                                        key={doc.id}
                                        className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                                    >
                                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                                            <FileText className="h-5 w-5 text-gray-400 flex-shrink-0" />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {doc.fileName}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {new Date(doc.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center ml-2">
                                            {getStatusIcon(doc.status)}
                                            <span className="ml-1 text-xs text-gray-500 capitalize">
                                                {doc.status.toLowerCase()}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
