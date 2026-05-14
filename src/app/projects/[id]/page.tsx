'use client'

import * as React from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { InteractiveMap } from '@/components/map'
import { LotModal } from '@/components/lot'
import { Sidebar } from '@/components/Sidebar'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Project, Lot } from '@prisma/client'

export default function ProjectPage() {
    const params = useParams()
    const router = useRouter()
    const [project, setProject] = React.useState<Project | null>(null)
    const [lots, setLots] = React.useState<Lot[]>([])
    const [selectedLot, setSelectedLot] = React.useState<Lot | null>(null)
    const [isModalOpen, setIsModalOpen] = React.useState(false)
    const [isLoading, setIsLoading] = React.useState(true)

    const fetchProjectData = React.useCallback(async () => {
        setIsLoading(true)
        try {
            const projRes = await fetch(`/api/projects`)
            const projData = await projRes.json()
            if (projData.success) {
                const found = projData.projects.find((p: Project) => p.id === params.id)
                if (found) {
                    setProject(found)
                } else {
                    router.push('/dashboard')
                    return
                }
            }

            const lotsRes = await fetch(`/api/lots?projectId=${params.id}`)
            const lotsData = await lotsRes.json()
            if (lotsData.success) {
                setLots(lotsData.lots)
            }
        } catch (error) {
            console.error('Error fetching project data:', error)
        } finally {
            setIsLoading(false)
        }
    }, [params.id, router])

    React.useEffect(() => {
        if (params.id) fetchProjectData()
    }, [params.id, fetchProjectData])

    const handleLotClick = (lot: Lot) => {
        setSelectedLot(lot)
        setIsModalOpen(true)
    }

    const handleCloseModal = () => {
        setIsModalOpen(false)
        setSelectedLot(null)
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
                    <p className="text-sm text-slate-500">Cargando plano...</p>
                </div>
            </div>
        )
    }

    if (!project) return null

    return (
        <div className="min-h-screen bg-slate-950">
            <Sidebar />

            <main className="pl-72 pr-4 min-h-screen flex flex-col">
                {/* Header */}
                <header className="h-14 sticky top-0 z-40 flex items-center justify-between px-4 bg-slate-950/80 backdrop-blur-md border-b border-white/5">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="flex items-center gap-2 text-xs text-slate-500 hover:text-white transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                            <span>Panel</span>
                        </Link>
                        <div className="h-4 w-px bg-white/10" />
                        <span className="text-sm font-medium text-white">{project.name}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                        <span className="text-xs text-slate-500">Haz clic en un lote para cotizar</span>
                    </div>
                </header>

                {/* Map */}
                <div className="flex-1 p-4 pb-4 flex flex-col min-h-0">
                    <div className="flex-1 relative rounded-xl overflow-hidden border border-white/5">
                        <InteractiveMap
                            projectId={project.id}
                            projectName={project.name}
                            mapImageUrl={project.mapImageUrl || '/maps/Lumina_SVG2.svg'}
                            lots={lots}
                            onLotClick={handleLotClick}
                            selectedLotId={selectedLot?.id}
                            className="h-full w-full"
                        />
                    </div>
                </div>

                <LotModal
                    lot={selectedLot}
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onUpdate={fetchProjectData}
                    projectSettings={{
                        maxCuotas: project.maxCuotas,
                        minInicial: project.minInicial
                    }}
                />
            </main>
        </div>
    )
}
