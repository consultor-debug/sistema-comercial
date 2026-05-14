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

            <main className="pl-72 pr-8 min-h-screen flex flex-col">
                {/* Top Header - Floating Glass Style */}
                <header className="h-20 sticky top-4 z-40 flex items-center justify-between px-8 glass-strong rounded-3xl mt-4 mb-8 shadow-2xl shadow-cyan-900/10">
                    <div className="flex items-center gap-6">
                        <Link href="/dashboard">
                            <motion.button 
                                whileHover={{ x: -4 }}
                                className="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/5 rounded-2xl text-xs font-bold text-slate-400 hover:text-white hover:border-cyan-500/30 transition-all uppercase tracking-widest"
                            >
                                <ArrowLeft className="w-4 h-4 text-cyan-400" />
                                <span>Panel</span>
                            </motion.button>
                        </Link>
                        
                        <div className="h-8 w-px bg-white/5" />
                        
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 shadow-lg shadow-cyan-500/10">
                                <Building2 className="w-5 h-5 text-cyan-400" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-0.5">Proyecto Seleccionado</span>
                                <span className="text-sm font-bold text-white uppercase tracking-tight">{project.name}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/5 rounded-2xl">
                            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Haz clic en un lote para cotizar</span>
                        </div>
                        
                        <div className="flex gap-2">
                            <button className="p-2.5 rounded-xl text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 border border-transparent hover:border-cyan-500/20 transition-all">
                                <Search className="w-4 h-4" />
                            </button>
                            <button className="p-2.5 rounded-xl text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 border border-transparent hover:border-cyan-500/20 transition-all">
                                <Settings className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </header>

                {/* Map Content Container */}
                <div className="flex-1 pb-8 flex flex-col min-h-0">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: "spring", damping: 20 }}
                        className="flex-1 relative rounded-[3rem] overflow-hidden shadow-[0_30px_70px_rgba(0,0,0,0.4)] border border-white/5 bg-slate-900/50 backdrop-blur-sm"
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
