'use client'

import * as React from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { InteractiveMap } from '@/components/map'
import { LotModal } from '@/components/lot'
import { Sidebar } from '@/components/Sidebar'
import { Button } from '@/components/ui/Button'
import { 
    Building2, ArrowLeft, Info, Loader2, 
    Calendar, Bell, Search, Settings 
} from 'lucide-react'
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
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-4"
                >
                    <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                    <p className="text-slate-400 font-medium animate-pulse">Cargando Plano Interactivo...</p>
                </motion.div>
            </div>
        )
    }

    if (!project) return null

    return (
        <div className="min-h-screen bg-slate-950">
            <Sidebar />

            <main className="md:pl-64 min-h-screen bg-grid flex flex-col">
                {/* Top Header */}
                <header className="h-14 md:h-16 border-b border-slate-700/50 glass-strong sticky top-0 z-40 px-4 md:px-8 flex items-center justify-between">
                    <div className="flex items-center gap-3 md:gap-6">
                        <Link href="/dashboard">
                            <motion.button 
                                whileHover={{ x: -4 }}
                                className="flex items-center gap-1 md:gap-2 text-[10px] md:text-xs font-bold text-slate-400 hover:text-white uppercase tracking-widest transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                <span className="hidden md:inline">Panel</span>
                            </motion.button>
                        </Link>
                        <div className="h-4 w-px bg-slate-700/50" />
                        <div className="flex items-center gap-2 md:gap-3">
                            <Building2 className="w-4 h-4 text-blue-500" />
                            <span className="text-xs md:text-sm font-black text-white uppercase tracking-tight truncate max-w-[150px] md:max-w-none">{project.name}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 md:gap-4">
                        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-800/30 border border-slate-700/50 rounded-xl text-slate-400">
                            <Info className="w-4 h-4 text-blue-400" />
                            <span className="text-[10px] font-bold uppercase tracking-tight">Haz clic en un lote para cotizar</span>
                        </div>
                        <div className="hidden md:block w-px h-6 bg-slate-800 mx-2" />
                        <div className="flex gap-1 md:gap-2">
                            <button className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all">
                                <Search className="w-4 h-4" />
                            </button>
                            <button className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all">
                                <Bell className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </header>

                {/* Map Content Container */}
                <div className="flex-1 p-2 md:p-6 lg:p-8 flex flex-col min-h-0">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex-1 relative rounded-2xl md:rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.3)] border border-white/5"
                    >
                        <InteractiveMap
                            projectId={project.id}
                            projectName={project.name}
                            mapImageUrl={project.mapImageUrl || '/maps/Lumina_SVG2.svg'}
                            lots={lots}
                            onLotClick={handleLotClick}
                            selectedLotId={selectedLot?.id}
                            className="h-full w-full"
                        />
                    </motion.div>
                </div>

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
            </main>
        </div>
    )
}
