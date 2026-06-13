'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Edit, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { getAllKnowledgeBases, addKnowledgeBases, editKnowledgeBases, delKnowledgeBases } from '@/lib/requestModule/request-bus'
import { CreateKnowledgeBaseInput, UpdateKnowledgeBaseInput } from '@rag-ai/shared-types'

interface KnowledgeBase {
    id: string;
    name: string;
    description: string;
    isPublic: boolean;
    createdAt: string;
    _count?: {
        documents: number;
    };
}

export default function KnowledgeBasesPage() {
    const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionType, setActionType] = useState('add');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newKB, setNewKB] = useState({ id: '', name: '', description: '' });

    useEffect(() => {
        loadKnowledgeBases();
    }, []);

    const loadKnowledgeBases = async () => {
        try {
            const response = await getAllKnowledgeBases()
            const { code, message, result } = response.data
            if (code === 0) {
                setKnowledgeBases(result)
            }
        } catch (error) {
            toast.error('Failed to load knowledge bases');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const params: CreateKnowledgeBaseInput | UpdateKnowledgeBaseInput = {
                name: newKB.name,
                description: newKB.description
            } as CreateKnowledgeBaseInput | UpdateKnowledgeBaseInput
            if (actionType === 'edit') {
                params.id = newKB.id
            }
            const response = actionType === 'add' ? await addKnowledgeBases(params as CreateKnowledgeBaseInput) : await editKnowledgeBases(params as UpdateKnowledgeBaseInput)
            const { code, message, result } = response.data
            if (code === 0) {
                toast.success(message);
                setShowCreateModal(false)
                setNewKB({ id: '', name: '', description: '' });
                loadKnowledgeBases()
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to create');
        }
    };

    const openKBModal = (type: string, kb?: any) => {
        setShowCreateModal(true)
        setActionType(type);
        setNewKB({
            ...newKB,
            id: type === 'add' ? '' : kb.id,
            description: type === 'add' ? '' : kb.description,
            name: type === 'add' ? '' : kb.name
        })
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this knowledge base?')) return;

        try {
            const response = await delKnowledgeBases(id)
            const { code, message, result } = response.data
            if (code === 0) {
                toast.success(message)
                loadKnowledgeBases()
            }
        } catch (error) {
            toast.error('Failed to delete');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-black">Knowledge Bases</h1>
                    <p className="mt-1 text-sm text-gray-600">
                        管理您的知识库并整理文档
                    </p>
                </div>
                <Button
                    onClick={() => openKBModal('add')}
                    className="bg-black text-white hover:bg-gray-800"
                >
                    <Plus className="h-5 w-5 mr-2" />
                    New Knowledge Base
                </Button>
            </div>

            {knowledgeBases.length === 0 ? (
                <Card className="text-center py-12">
                    <CardContent>
                        <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No knowledge bases</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Get started by creating a new knowledge base.
                        </p>
                        <div className="mt-6">
                            <Button
                                onClick={() => openKBModal('add')}
                                className="bg-black text-white hover:bg-gray-800"
                            >
                                <Plus className="h-5 w-5 mr-2" />
                                Create Knowledge Base
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {knowledgeBases.map((kb) => (
                        <Card
                            key={kb.id}
                            className="overflow-hidden hover:shadow-md transition-shadow"
                        >
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <Link
                                            href={`/dashboard/knowledge-bases/${kb.id}`}
                                            className="block"
                                        >
                                            <h3 className="text-lg font-semibold text-black hover:text-gray-700">
                                                {kb.name}
                                            </h3>
                                        </Link>
                                        <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                                            {kb.description || 'No description'}
                                        </p>
                                        <div className="mt-4 flex items-center text-sm text-gray-500">
                                            <span>{kb._count?.documents || 0} documents</span>
                                        </div>
                                    </div>
                                    <div className="flex space-x-2 ml-4">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-gray-400 hover:text-black"
                                            onClick={() => openKBModal('edit', kb)}
                                        >
                                            <Edit className="h-5 w-5" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(kb.id)}
                                            className="text-gray-400 hover:text-red-600"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
                    <div className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-white p-6 shadow-lg sm:rounded-lg">
                        <div className="flex flex-col space-y-1.5 text-center sm:text-left">
                            <h2 className="text-lg font-semibold leading-none tracking-tight">
                                {actionType === 'add' ? 'Create Knowledge Base' : 'Edit Knowledge Base'}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Fill in the details for your knowledge base.
                            </p>
                        </div>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    required
                                    value={newKB.name}
                                    onChange={(e) => setNewKB({ ...newKB, name: e.target.value })}
                                    placeholder="Enter knowledge base name"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={newKB.description}
                                    onChange={(e) =>
                                        setNewKB({ ...newKB, description: e.target.value })
                                    }
                                    rows={3}
                                    placeholder="Optional description"
                                />
                            </div>
                            <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowCreateModal(false)}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" className="bg-black text-white hover:bg-gray-800">
                                    {actionType === 'add' ? 'Create' : 'Save'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
