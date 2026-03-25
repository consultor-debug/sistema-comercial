'use client'

import * as React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
    Building2,
    Plus,
    Trash2,
    ChevronLeft,
    Loader2,
    Box,
    CheckCircle2,
    Clock,
    XCircle,
    Map,
    Edit2,
    Globe
} from 'lucide-react'
import { Input, Textarea, Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@/components/ui'
import { getSessionInfo } from '../users/actions'

interface ProjectData {
    id: string;
    name: string;
    description: string | null;
    isActive: boolean;
    tenantId: string | null;
    maxCuotas: number;
    minInicial: number;
    sheetsId: string | null;
    n8nWebhookUrl: string | null;
    tenant?: { name: string } | null;
    stats: { total: number; libre: number; separado: number; vendido: number };
}

export default function ProjectsManagementPage() {
    const [projects, setProjects] = React.useState<ProjectData[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [isDeleting, setIsDeleting] = React.useState(false)
    const [isSaving, setIsSaving] = React.useState(false)
    const [projectToDelete, setProjectToDelete] = React.useState<ProjectData | null>(null)
    const [projectToEdit, setProjectToEdit] = React.useState<ProjectData | null>(null)
    const [sessionInfo, setSessionInfo] = React.useState<{ role?: string; availableTenants?: { id: string; name: string }[] } | null>(null)

    const fetchProjects = async () => {
        setIsLoading(true)
        try {
            const [projectsRes, sessionData] = await Promise.all([
                fetch('/api/projects'),
                getSessionInfo()
            ])
            const projectsData = await projectsRes.json()
            if (projectsData.success) {
                setProjects(projectsData.projects)
            }
            setSessionInfo(sessionData)
        } catch (error) {
            console.error('Error fetching projects:', error)
        } finally {
            setIsLoading(false)
        }
    }

    React.useEffect(() => {
        fetchProjects()
    }, [])

    const handleDelete = async () => {
        if (!projectToDelete) return

        setIsDeleting(true)
        try {
            const res = await fetch(`/api/projects?id=${projectToDelete.id}`, {
                method: 'DELETE'
            })
            const data = await res.json()
            if (data.success) {
                setProjectToDelete(null)
                fetchProjects()
            }
        } catch (error) {
            console.error('Error deleting project:', error)
        } finally {
            setIsDeleting(false)
        }
    }

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!projectToEdit) return

        setIsSaving(true)
        try {
            const res = await fetch(`/api/projects`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(projectToEdit)
            })
            const data = await res.json()
            if (data.success) {
                setProjectToEdit(null)
                fetchProjects()
            }
        } catch (error) {
            console.error('Error updating project:', error)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="container mx-auto px-6 py-8 max-w-6xl">
            {/* Header */}
            <div className="flex flex-col gap-4 mb-8">
                <Link
                    href="/admin"
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors w-fit group"
                >
                    <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                    <span className="text-sm font-medium">Volver al Dashboard</span>
                </Link>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center border border-purple-500/30" >
                            <Building2 className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Gestión de Proyectos</h1>
                            <p className="text-slate-400">Ver y administrar los proyectos de tu inmobiliaria</p>
                        </div>
                    </div>

                    <Link href="/admin/projects/new">
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Nuevo Proyecto
                        </Button>
                    </Link>
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                    <Loader2 className="w-10 h-10 animate-spin mb-4" />
                    <p>Cargando proyectos...</p>
                </div>
            ) : projects.length === 0 ? (
                <div className="text-center py-20 bg-slate-900/50 border border-slate-700/50 rounded-2xl">
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Building2 className="w-8 h-8 text-slate-600" />
                    </div>
                    <h3 className="text-white font-semibold mb-2">No hay proyectos</h3>
                    <p className="text-slate-500 mb-6">Comienza creando tu primer proyecto inmobiliario</p>
                    <Link href="/admin/projects/new">
                        <Button variant="outline">Crear Proyecto</Button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project) => (
                        <Card key={project.id} className="bg-slate-900 border-slate-700/50 hover:border-slate-600 transition-all flex flex-col h-full overflow-hidden">
                            <CardHeader className="border-b border-slate-800">
                                <div className="flex justify-between items-start">
                                    <div className="max-w-[80%]">
                                        <div className="flex items-center gap-2 mb-1">
                                            <CardTitle className="text-white truncate" title={project.name}>{project.name}</CardTitle>
                                        </div>
                                        {sessionInfo?.role === 'SUPER_ADMIN' && project.tenant && (
                                            <div className="flex items-center gap-1.5 mb-2 text-xs text-blue-400 font-medium">
                                                <Globe className="w-3 h-3" />
                                                <span>{project.tenant.name}</span>
                                            </div>
                                        )}
                                        <CardDescription className="line-clamp-1">{project.description || 'Sin descripción'}</CardDescription>
                                    </div>
                                    <Badge variant={project.isActive ? 'success' : 'neutral'}>
                                        {project.isActive ? 'Activo' : 'Inactivo'}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6 flex-1">
                                {/* Stats grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Total Lotes</span>
                                        <div className="flex items-center gap-2">
                                            <Box className="w-3 h-3 text-blue-400" />
                                            <span className="text-white font-semibold">{project.stats.total}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Libres</span>
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                            <span className="text-white font-semibold">{project.stats.libre}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Separados</span>
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-3 h-3 text-amber-500" />
                                            <span className="text-white font-semibold">{project.stats.separado}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Vendidos</span>
                                        <div className="flex items-center gap-2">
                                            <XCircle className="w-3 h-3 text-rose-500" />
                                            <span className="text-white font-semibold">{project.stats.vendido}</span>
                                           </div>
                                    </div>
                                </div>

                                {/* Connection Indicators */}
                                <div className="flex flex-wrap gap-2">
                                    {project.sheetsId ? (
                                        <Badge variant="success" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 py-0.5">
                                            <Building2 className="w-3 h-3 mr-1" />
                                            Sheets Link
                                        </Badge>
                                    ) : (
                                        <Badge variant="neutral" className="bg-slate-800 text-slate-500 border-slate-700 py-0.5">
                                            Sin Sheets
                                        </Badge>
                                    )}
                                    {project.n8nWebhookUrl ? (
                                        <Badge variant="success" className="bg-blue-500/10 text-blue-400 border-blue-500/20 py-0.5" title={project.n8nWebhookUrl}>
                                            <Globe className="w-3 h-3 mr-1" />
                                            Webhook
                                        </Badge>
                                    ) : (
                                        <Badge variant="neutral" className="bg-slate-800 text-slate-500 border-slate-700 py-0.5">
                                            Sin Webhook
                                        </Badge>
                                    )}
                                </div>

                                <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-2">
                                    <div className="flex gap-2">
                                        <Link href={`/admin/lots/map?projectId=${project.id}`}>
                                            <Button variant="ghost" size="sm" className="h-9 px-3">
                                                <Map className="w-4 h-4 mr-2" />
                                                Mapa
                                            </Button>
                                        </Link>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-9 px-3 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                                            onClick={() => setProjectToEdit({ ...project })}
                                        >
                                            <Edit2 className="w-4 h-4 mr-2" />
                                            Editar
                                        </Button>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 h-9 w-9 p-0"
                                        onClick={() => setProjectToDelete(project)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <Modal isOpen={!!projectToDelete} onClose={() => setProjectToDelete(null)} size="sm">
                <ModalHeader>
                    <ModalTitle className="text-rose-500 flex items-center gap-2">
                        <Trash2 className="w-5 h-5" />
                        Eliminar Proyecto
                    </ModalTitle>
                </ModalHeader>
                <ModalBody>
                    <p className="text-slate-300">
                        ¿Estás seguro que deseas eliminar el proyecto <strong className="text-white">&quot;{projectToDelete?.name}&quot;</strong>?
                    </p>
                    <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-400" >
                        <strong>Atención:</strong> Esta acción eliminará permanentemente todos los lotes y cotizaciones vinculadas a este proyecto. No se puede deshacer.
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button variant="ghost" onClick={() => setProjectToDelete(null)} disabled={isDeleting}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleDelete}
                        className="bg-rose-600 hover:bg-rose-500 text-white"
                        isLoading={isDeleting}
                    >
                        Eliminar Definitivamente
                    </Button>
                </ModalFooter>
            </Modal>

            {/* Edit Project Modal */}
            <Modal isOpen={!!projectToEdit} onClose={() => setProjectToEdit(null)} size="default">
                <form onSubmit={handleUpdate}>
                    <ModalHeader>
                        <ModalTitle className="flex items-center gap-2">
                            <Edit2 className="w-5 h-5 text-blue-400" />
                            Editar Proyecto
                        </ModalTitle>
                    </ModalHeader>
                    <ModalBody className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Nombre del Proyecto</label>
                            <Input
                                value={projectToEdit?.name || ''}
                                onChange={(e) => setProjectToEdit((prev) => prev ? ({ ...prev, name: e.target.value }) : null)}
                                placeholder="Ej: Condominio Las Palmeras"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Descripción</label>
                            <Textarea
                                value={projectToEdit?.description || ''}
                                onChange={(e) => setProjectToEdit((prev) => prev ? ({ ...prev, description: e.target.value }) : null)}
                                placeholder="Breve descripción del proyecto..."
                                rows={3}
                            />
                        </div>

                        {sessionInfo?.role === 'SUPER_ADMIN' && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Empresa (Tenant)</label>
                                <select
                                    className="w-full bg-slate-800 border-slate-700 rounded-lg h-10 px-3 text-white outline-none focus:ring-2 focus:ring-blue-500"
                                    value={projectToEdit?.tenantId || ''}
                                    onChange={(e) => setProjectToEdit((prev) => prev ? ({ ...prev, tenantId: e.target.value }) : null)}
                                    required
                                >
                                    <option value="">Seleccione una empresa</option>
                                    {sessionInfo.availableTenants?.map((t: { id: string; name: string }) => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Máx. Cuotas</label>
                                <Input
                                    type="number"
                                    value={projectToEdit?.maxCuotas || ''}
                                    onChange={(e) => setProjectToEdit((prev) => prev ? ({ ...prev, maxCuotas: parseInt(e.target.value) || 0 }) : null)}
                                    placeholder="60"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Mín. Inicial (%)</label>
                                <Input
                                    type="number"
                                    value={projectToEdit?.minInicial || ''}
                                    onChange={(e) => setProjectToEdit((prev) => prev ? ({ ...prev, minInicial: parseFloat(e.target.value) || 0 }) : null)}
                                     placeholder="20"
                                 />
                             </div>
                         </div>

                         <div className="space-y-2">
                             <label className="text-sm font-medium text-slate-300">Google Sheet ID</label>
                             <Input
                                 value={projectToEdit?.sheetsId || ''}
                                 onChange={(e) => setProjectToEdit((prev) => prev ? ({ ...prev, sheetsId: e.target.value }) : null)}
                                 placeholder="ID del Excel (ej: 1bxto...)"
                             />
                         </div>

                         <div className="space-y-2">
                             <label className="text-sm font-medium text-slate-300">n8n Webhook URL</label>
                             <Input
                                 value={projectToEdit?.n8nWebhookUrl || ''}
                                 onChange={(e) => setProjectToEdit((prev) => prev ? ({ ...prev, n8nWebhookUrl: e.target.value }) : null)}
                                 placeholder="https://tu-n8n.host/..."
                             />
                         </div>
                     </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" type="button" onClick={() => setProjectToEdit(null)} disabled={isSaving}>
                            Cancelar
                        </Button>
                        <Button type="submit" isLoading={isSaving} disabled={isSaving}>
                            Guardar Cambios
                        </Button>
                    </ModalFooter>
                </form>
            </Modal>
        </div>
    )
}
