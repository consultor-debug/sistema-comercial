'use client'

import * as React from 'react'
import Link from 'next/link'
import { MapCoordinateEditor } from '@/components/map'
import { Button } from '@/components/ui/Button'
import {
    ArrowLeft,
    Map as MapIcon,
    Database,
    Loader2,
    AlertCircle,
    CheckCircle2,
    Trash2
} from 'lucide-react'
import { Project, Lot, Prisma } from '@prisma/client'

export default function MapEditorPage() {
    const [projects, setProjects] = React.useState<Project[]>([])
    const [selectedProject, setSelectedProject] = React.useState<Project | null>(null)
    const [lots, setLots] = React.useState<Lot[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [error, setError] = React.useState<string | null>(null)
    const [successMessage, setSuccessMessage] = React.useState<string | null>(null)
    const [isResetting, setIsResetting] = React.useState(false)

    const handleResetPoints = async () => {
        if (!selectedProject || !window.confirm('¿Estás seguro de que deseas eliminar todas las coordenadas mappedas de este proyecto? (Esto no borra los lotes, solo sus posiciones)')) return;
        
        setIsResetting(true)
        setError(null)
        try {
            const res = await fetch('/api/admin/lots/reset-map', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId: selectedProject.id })
            })
            if (res.ok) {
                setSuccessMessage('Todas las coordenadas han sido eliminadas')
                setTimeout(() => setSuccessMessage(null), 3000)
                // Refetch lots for the current project to clear the UI
                handleProjectSelect(selectedProject)
            } else {
                setError('Error al resetear coordenadas')
            }
        } catch {
            setError('Error al reiniciar coordenadas')
        } finally {
            setIsResetting(false)
        }
    }

    const fetchProjects = React.useCallback(async () => {
        try {
            const res = await fetch('/api/projects')
            const data = await res.json()
            if (data.success) {
                setProjects(data.projects)
                if (data.projects.length > 0) {
                    handleProjectSelect(data.projects[0])
                }
            }
        } catch {
            setError('Error al cargar proyectos')
        } finally {
            setIsLoading(false)
        }
    }, [])

    React.useEffect(() => {
        fetchProjects()
    }, [fetchProjects])

    const handleProjectSelect = async (project: Project) => {
        setSelectedProject(project)
        setIsLoading(true)
        try {
            const res = await fetch(`/api/lots?projectId=${project.id}`)
            const data = await res.json()
            if (data.success) {
                setLots(data.lots)
            }
        } catch {
            setError('Error al cargar lotes')
        } finally {
            setIsLoading(false)
        }
    }

    const handleSaveCoordinate = async (lotId: string, data: Record<string, unknown>) => {
        try {
            const res = await fetch(`/api/lots/${lotId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mapShapeType: 'circle',
                    mapShapeData: data
                })
            })

            if (res.ok) {
                // Update local list
                setLots(prev => prev.map(l =>
                    l.id === lotId ? { ...l, mapShapeData: data as Prisma.JsonObject, mapShapeType: 'circle' } : l
                ))
                setSuccessMessage('Posición guardada correctamente')
                setTimeout(() => setSuccessMessage(null), 3000)
            } else {
                throw new Error('No se pudo guardar')
            }
        } catch {
            alert('Error al guardar la posición')
        }
    }

    if (isLoading && projects.length === 0) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto" />
                    <p className="text-slate-400">Cargando editor...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-grid flex flex-col">
            {/* Header */}
            <header className="glass-strong border-b border-slate-700/50 sticky top-0 z-40">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/admin">
                            <Button variant="ghost" size="sm">
                                <ArrowLeft className="w-4 h-4" />
                                Admin
                            </Button>
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                                <MapIcon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-white">Editor de Mapa</h1>
                                <p className="text-xs text-slate-400">Ubica los lotes sobre el plano</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {successMessage && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-sm animate-in fade-in slide-in-from-top-1">
                                <CheckCircle2 className="w-4 h-4" />
                                {successMessage}
                            </div>
                        )}
                        {selectedProject && (
                            <Button 
                                variant="destructive" 
                                size="sm" 
                                onClick={handleResetPoints} 
                                isLoading={isResetting}
                                className="h-9 px-3 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white border border-rose-500/50"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Resetear Puntos
                            </Button>
                        )}
                        <select
                            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500"
                            value={selectedProject?.id || ''}
                            onChange={(e) => {
                                const p = projects.find(proj => proj.id === e.target.value)
                                if (p) handleProjectSelect(p)
                            }}
                        >
                            {projects.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 container mx-auto px-6 py-8">
                {error && (
                    <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-rose-400" />
                        <p className="text-rose-400">{error}</p>
                    </div>
                )}

                {selectedProject ? (
                    <MapCoordinateEditor
                        mapImageUrl={selectedProject.mapImageUrl || '/maps/Lumina_SVG2.svg'}
                        lots={lots}
                        onSave={handleSaveCoordinate}
                    />
                ) : (
                    <div className="h-[600px] flex flex-col items-center justify-center bg-slate-900/50 border border-dashed border-slate-700 rounded-3xl text-center p-8">
                        <Database className="w-16 h-16 text-slate-700 mb-6" />
                        <h2 className="text-xl font-bold text-white mb-2">No hay proyectos activos</h2>
                        <p className="text-slate-500 max-w-sm mb-8">
                            Para empezar a ubicar lotes, primero debes crear un proyecto o importar una base de datos de lotes.
                        </p>
                        <Link href="/admin/lots">
                            <Button>
                                <Database className="w-4 h-4" />
                                Importar Lotes
                            </Button>
                        </Link>
                    </div>
                )}
            </main>
        </div>
    )
}
