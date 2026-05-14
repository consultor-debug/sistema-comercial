'use client'

import * as React from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { InteractiveMap } from '@/components/map'
import { LotPanel } from '@/components/lot/LotPanel'
import { Sidebar } from '@/components/Sidebar'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Project, Lot } from '@prisma/client'

export default function ProjectPage() {
    const params = useParams()
    const router = useRouter()
    const [project, setProject] = React.useState<Project | null>(null)
    const [lots, setLots] = React.useState<Lot[]>([])
    const [selectedLot, setSelectedLot] = React.useState<Lot | null>(null)
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
    }

    const handleClosePanel = () => {
        setSelectedLot(null)
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-5 h-5 text-slate-500 animate-spin" />
                    <p className="text-xs text-slate-500">Cargando plano...</p>
                </div>
            </div>
        )
    }

    if (!project) return null

    return (
        <div className="min-h-screen bg-slate-950 flex">
            <Sidebar />

            {/* Main content — fills available space */}
            <div className="flex-1 pl-52 flex flex-col min-h-screen">
                {/* Header */}
                <header className="h-11 shrink-0 flex items-center justify-between px-4 bg-slate-950 border-b border-white/5 z-40">
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard" className="flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-white transition-colors">
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span>Panel</span>
                        </Link>
                        <div className="h-3.5 w-px bg-white/10" />
                        <span className="text-xs font-medium text-white">{project.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-600">
                        {selectedLot ? `Lote ${selectedLot.code} seleccionado` : 'Selecciona un lote para cotizar'}
                    </span>
                </header>

                {/* Map + Panel split */}
                <div className="flex-1 flex min-h-0">
                    {/* Map area */}
                    <div className="flex-1 relative min-w-0">
                        <InteractiveMap
                            projectId={project.id}
                            projectName={project.name}
                            mapImageUrl={project.mapImageUrl || '/maps/Lumina_SVG2.svg'}
                            lots={lots}
                            onLotClick={handleLotClick}
                            selectedLotId={selectedLot?.id}
                            className="absolute inset-0"
                        />
                    </div>

                    {/* Right panel — slides in when lot selected */}
                    {selectedLot && (
                        <div 
                            className="w-80 shrink-0 animate-in slide-in-from-right duration-200"
                            style={{ animationFillMode: 'both' }}
                        >
                            <LotPanel
                                lot={selectedLot}
                                onClose={handleClosePanel}
                                onUpdate={() => {
                                    fetchProjectData()
                                    handleClosePanel()
                                }}
                                projectSettings={{
                                    maxCuotas: project.maxCuotas,
                                    minInicial: project.minInicial
                                }}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
