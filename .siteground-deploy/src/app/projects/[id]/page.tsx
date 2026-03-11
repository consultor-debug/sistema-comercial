'use client'

import * as React from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { InteractiveMap } from '@/components/map'
import { LotModal } from '@/components/lot'
import { Button } from '@/components/ui/Button'
import { Building2, ArrowLeft, Info, Loader2 } from 'lucide-react'
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
            // Fetch project details
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

            // Fetch lots
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
        if (params.id) {
            fetchProjectData()
        }
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
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            </div>
        )
    }

    if (!project) return null

    return (
        <div className="min-h-screen bg-grid">
            {/* Header */}
            <header className="glass-strong sticky top-0 z-40 border-b border-slate-700/50">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard">
                                <Button variant="ghost" size="sm">
                                    <ArrowLeft className="w-4 h-4" />
                                    Volver
                                </Button>
                            </Link>

                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                                    <Building2 className="w-6 h-6" />
                                </div>
                                <div>
                                    <h1 className="text-lg font-bold text-white leading-tight">{project.name}</h1>
                                    <p className="text-xs text-slate-400">Plano Interactivo de Lotes</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-slate-400 bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700/50">
                            <Info className="w-4 h-4 text-blue-400" />
                            <span>Haz clic en un lote para ver detalles</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main content */}
            <main className="container mx-auto px-6 py-6">
                <InteractiveMap
                    projectName={project.name}
                    mapImageUrl={project.mapImageUrl || '/maps/Lumina_SVG2.svg'}
                    lots={lots}
                    onLotClick={handleLotClick}
                    selectedLotId={selectedLot?.id}
                    className="min-h-[750px] shadow-2xl"
                />
            </main>

            {/* Lot Modal */}
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
        </div>
    )
}
