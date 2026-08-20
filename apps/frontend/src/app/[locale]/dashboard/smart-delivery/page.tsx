'use client'

import { useState } from 'react'
import { useRouter } from '@/navigation'
import { useTranslations } from 'next-intl'
import {
    Check,
    ChevronRight,
    Circle,
    Crown,
    Loader2,
    LockKeyhole,
    Search,
    Send,
    Sparkles,
    Target,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

type Stage = 'criteria' | 'screening' | 'jd' | 'match' | 'greeting' | 'confirm' | 'sent'
type Job = {
    id: string
    title: string
    company: string
    location: string
    score: number
    tags: string[]
}

const stages: { id: Exclude<Stage, 'sent'>; icon: typeof Search }[] = [
    { id: 'criteria', icon: Search },
    { id: 'screening', icon: Sparkles },
    { id: 'jd', icon: Target },
    { id: 'match', icon: Check },
    { id: 'greeting', icon: Send },
    { id: 'confirm', icon: Circle },
]

const jobs: Job[] = [
    {
        id: '1',
        title: 'seniorProductManager',
        company: 'galaxyTech',
        location: 'hangzhouSalary',
        score: 94,
        tags: ['aiProduct', 'bProduct', 'experience5to10'],
    },
    {
        id: '2',
        title: 'productLead',
        company: 'cloudSail',
        location: 'shanghaiSalary',
        score: 88,
        tags: ['strategicPlanning', 'teamManagement', 'toB'],
    },
    {
        id: '3',
        title: 'aiProductManager',
        company: 'originLab',
        location: 'beijingSalary',
        score: 82,
        tags: ['largeModel', 'userGrowth', 'experience0to1'],
    },
]

export default function SmartDeliveryPage() {
    const router = useRouter()
    const t = useTranslations('smartDelivery')
    const [stage, setStage] = useState<Stage>('criteria')
    const [platform, setPlatform] = useState('boss')
    const [criteria, setCriteria] = useState('')
    const [selectedJob, setSelectedJob] = useState<Job>(jobs[0])
    const [greeting, setGreeting] = useState(t('defaultGreeting'))
    const [sent, setSent] = useState<string[]>([])
    const isSupremeMember = false
    const [screeningLocked, setScreeningLocked] = useState(false)

    const runScreening = () => {
        if (!criteria.trim()) return
        if (!isSupremeMember) {
            setScreeningLocked(true)
            setStage('jd')
            return
        }
        setStage('screening')
        window.setTimeout(() => setStage('jd'), 700)
    }
    const confirmDelivery = () => {
        setStage('sent')
        setSent((current) => [...current, selectedJob.id])
    }
    const activeIndex =
        stage === 'sent' ? stages.length : stages.findIndex((item) => item.id === stage)
    const selectedIsSent = sent.includes(selectedJob.id)
    const jobText = (key: string) => t(`jobs.${key}`)

    return (
        <div className="mx-auto max-w-6xl space-y-7 pb-10">
            <section className="relative overflow-hidden rounded-2xl bg-black px-6 py-8 text-white sm:px-10 sm:py-10">
                <div className="relative z-10 max-w-2xl">
                    <div className="mb-3 flex items-center gap-2 text-gray-300">
                        <Send className="h-4 w-4" />
                        <span className="text-xs font-bold uppercase tracking-[0.24em]">
                            {t('eyebrow')}
                        </span>
                    </div>
                    <h1 className="text-3xl font-bold sm:text-4xl">{t('title')}</h1>
                    <p className="mt-3 max-w-xl text-sm leading-6 text-gray-300">
                        {t('description')}
                    </p>
                </div>
                <div className="absolute -right-8 -top-12 h-52 w-52 rounded-full border-[24px] border-white/15" />
            </section>

            <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_280px]">
                <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                        {stages.map((item, index) => {
                            const Icon = item.icon
                            const complete = index < activeIndex
                            const current = item.id === stage
                            return (
                                <div
                                    key={item.id}
                                    className={`rounded-lg border p-3 text-center ${current ? 'border-black bg-black text-white' : complete ? 'border-gray-400 bg-gray-100 text-gray-700' : 'border-gray-200 bg-white text-gray-400'}`}
                                >
                                    <Icon className="mx-auto h-4 w-4" />
                                    <p className="mt-2 text-[11px] font-medium leading-4">
                                        {t(`stages.${item.id}`)}
                                    </p>
                                </div>
                            )
                        })}
                    </div>

                    {stage === 'criteria' && (
                        <Card>
                            <CardContent className="p-6 sm:p-8">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h2 className="text-xl font-bold text-black">
                                            {t('criteria.title')}
                                        </h2>
                                        <p className="mt-1 text-sm text-gray-500">
                                            {t('criteria.description')}
                                        </p>
                                    </div>
                                    <Search className="h-6 w-6 text-gray-700" />
                                </div>
                                <textarea
                                    value={criteria}
                                    onChange={(event) => setCriteria(event.target.value)}
                                    placeholder={t('criteria.placeholder')}
                                    className="mt-6 min-h-32 w-full resize-none rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black"
                                />
                                <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
                                    <label className="text-sm font-medium text-gray-700">
                                        {t('criteria.platform')}
                                        <select
                                            value={platform}
                                            onChange={(event) => setPlatform(event.target.value)}
                                            className="mt-2 block h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-black"
                                        >
                                            <option value="boss">{t('platforms.boss')}</option>
                                            <option disabled>{t('platforms.lagou')}</option>
                                            <option disabled>{t('platforms.zhilian')}</option>
                                            <option disabled>{t('platforms.51job')}</option>
                                        </select>
                                    </label>
                                    <Button
                                        type="button"
                                        disabled={!criteria.trim()}
                                        onClick={runScreening}
                                        className="h-11 bg-black px-6 text-white hover:bg-gray-800"
                                    >
                                        <Sparkles className="mr-2 h-4 w-4" />
                                        {t('criteria.start')}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {stage === 'screening' && (
                        <Card>
                            <CardContent className="flex min-h-72 flex-col items-center justify-center p-8 text-center">
                                <Loader2 className="h-10 w-10 animate-spin text-gray-700" />
                                <h2 className="mt-5 text-xl font-bold">{t('screening.title')}</h2>
                                <p className="mt-2 text-sm text-gray-500">
                                    {t('screening.description')}
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {stage !== 'criteria' && stage !== 'screening' && (
                        <Card>
                            <CardContent className="relative p-6 sm:p-8">
                                <div
                                    className={screeningLocked ? 'select-none blur-sm' : undefined}
                                >
                                    <div className="flex items-center justify-between gap-4">
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-widest text-gray-600">
                                                {t('platforms.bossName')}
                                            </p>
                                            <h2 className="mt-1 text-xl font-bold text-black">
                                                {t('jobsFound', { count: jobs.length })}
                                            </h2>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setStage('criteria')}
                                            className="text-sm text-gray-500 underline underline-offset-4"
                                        >
                                            {t('editCriteria')}
                                        </button>
                                    </div>
                                    <div className="mt-6 space-y-3">
                                        {jobs.map((job) => (
                                            <button
                                                type="button"
                                                key={job.id}
                                                onClick={() => {
                                                    setSelectedJob(job)
                                                    if (stage === 'sent' && !sent.includes(job.id))
                                                        setStage('greeting')
                                                }}
                                                className={`w-full rounded-xl border p-4 text-left transition ${selectedJob.id === job.id ? 'border-black bg-gray-50 ring-1 ring-black' : 'border-gray-200 hover:border-gray-400'}`}
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <div>
                                                        <h3 className="font-semibold text-black">
                                                            {jobText(job.title)}
                                                        </h3>
                                                        <p className="mt-1 text-sm text-gray-600">
                                                            {jobText(job.company)} ·{' '}
                                                            {jobText(job.location)}
                                                        </p>
                                                        <div className="mt-3 flex flex-wrap gap-2">
                                                            {job.tags.map((tag) => (
                                                                <span
                                                                    key={tag}
                                                                    className="rounded bg-white px-2 py-1 text-xs text-gray-600"
                                                                >
                                                                    {jobText(tag)}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <span className="text-2xl font-bold text-black">
                                                        {job.score}
                                                        <small className="ml-0.5 text-xs font-normal">
                                                            %
                                                        </small>
                                                    </span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                    {stage === 'jd' && (
                                        <Button
                                            type="button"
                                            onClick={() => setStage('match')}
                                            className="mt-6 w-full bg-black text-white hover:bg-gray-800"
                                        >
                                            {t('jd.viewMatch')}
                                            <ChevronRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    )}
                                    {stage === 'match' && (
                                        <div className="mt-6 rounded-xl border border-gray-300 bg-gray-50 p-4">
                                            <p className="text-sm font-semibold text-gray-800">
                                                {t('match.summary', { score: selectedJob.score })}
                                            </p>
                                            <p className="mt-2 text-sm leading-6 text-gray-700">
                                                {t('match.description')}
                                            </p>
                                            <Button
                                                type="button"
                                                onClick={() => setStage('greeting')}
                                                className="mt-4 bg-black text-white hover:bg-gray-800"
                                            >
                                                {t('match.generateGreeting')}
                                                <ChevronRight className="ml-2 h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                    {(stage === 'greeting' ||
                                        stage === 'confirm' ||
                                        stage === 'sent') && (
                                            <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4">
                                                <label className="text-sm font-semibold text-black">
                                                    {t('greeting.label', {
                                                        company: jobText(selectedJob.company),
                                                    })}
                                                    <textarea
                                                        value={greeting}
                                                        onChange={(event) =>
                                                            setGreeting(event.target.value)
                                                        }
                                                        disabled={stage !== 'greeting'}
                                                        className="mt-3 min-h-32 w-full resize-none rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm leading-6 outline-none focus:border-black"
                                                    />
                                                </label>
                                                {stage === 'greeting' && (
                                                    <Button
                                                        type="button"
                                                        onClick={() => setStage('confirm')}
                                                        className="mt-4 bg-black text-white hover:bg-gray-800"
                                                    >
                                                        {t('greeting.confirm')}
                                                        <ChevronRight className="ml-2 h-4 w-4" />
                                                    </Button>
                                                )}
                                                {stage === 'confirm' && (
                                                    <div className="mt-4 flex flex-col gap-3 rounded-lg bg-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between">
                                                        <p className="text-sm text-gray-700">
                                                            {t('confirm.description')}
                                                        </p>
                                                        {isSupremeMember ? (
                                                            <Button
                                                                type="button"
                                                                onClick={confirmDelivery}
                                                                disabled={selectedIsSent}
                                                                className="bg-black text-white hover:bg-gray-800"
                                                            >
                                                                <Send className="mr-2 h-4 w-4" />
                                                                {t('confirm.send')}
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                type="button"
                                                                onClick={() =>
                                                                    router.push('/dashboard/membership')
                                                                }
                                                                variant="outline"
                                                                className="border-gray-700 text-gray-800 hover:bg-white"
                                                            >
                                                                <LockKeyhole className="mr-2 h-4 w-4" />
                                                                {t('confirm.upgrade')}
                                                            </Button>
                                                        )}
                                                    </div>
                                                )}
                                                {stage === 'sent' && (
                                                    <p className="mt-4 flex items-center gap-2 rounded-lg bg-gray-100 p-3 text-sm text-gray-700">
                                                        <Check className="h-4 w-4" />
                                                        {t('sent')}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                </div>
                                {screeningLocked && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 px-6 text-center backdrop-blur-[1px]">
                                        <LockKeyhole
                                            className="h-16 w-16 text-gray-800"
                                            strokeWidth={1.5}
                                        />
                                        <p className="mt-4 text-lg font-bold text-black">
                                            {t('locked.title')}
                                        </p>
                                        <p className="mt-2 max-w-sm text-sm text-gray-600">
                                            {t('locked.description')}
                                        </p>
                                        <Button
                                            type="button"
                                            onClick={() => router.push('/dashboard/membership')}
                                            className="mt-5 bg-black text-white hover:bg-gray-800"
                                        >
                                            {t('locked.upgrade')}
                                            <ChevronRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>

                <aside className="space-y-4">
                    <Card className="border-gray-300 bg-gray-50">
                        <CardContent className="p-5">
                            <div className="flex items-center gap-2 text-gray-800">
                                <Crown className="h-5 w-5" />
                                <h2 className="font-bold">{t('supreme.title')}</h2>
                            </div>
                            <p className="mt-3 text-sm leading-6 text-gray-700">
                                {t('supreme.description')}
                            </p>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.push('/dashboard/membership')}
                                className="mt-4 w-full border-gray-700 text-gray-800 hover:bg-white"
                            >
                                {t('supreme.upgrade')}
                                <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-5">
                            <h2 className="font-semibold text-black">{t('records.title')}</h2>
                            <div className="mt-4 flex min-h-24 items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 text-center">
                                <p className="text-sm text-gray-500">{t('records.empty')}</p>
                            </div>
                        </CardContent>
                    </Card>
                </aside>
            </div>
        </div>
    )
}
