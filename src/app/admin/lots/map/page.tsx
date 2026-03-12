'use client'

import * as React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import {
    Upload, Map, Check,
    ArrowLeft, AlertCircle, Image as ImageIcon, FileImage, X, Eye
} from 'lucide-react'

export default function AdminMapPage() {
    const [mapFile, setMapFile] = React.useState<File | null>(null)
    const [mapPreview, setMapPreview] = React.useState<string | null>(null)
    const [projects, setProjects] = React.useState<{ id: string, name: string }[]>([])
    const [selectedProject, setSelectedProject] = React.useState<string>('')
    // const [projectName, setProjectName] = React.useState('Mi Proyecto') // Removed unused state
    const [isUploading, setIsUploading] = React.useState(false)
    const [uploadStatus, setUploadStatus] = React.useState<'idle' | 'success' | 'error'>('idle')
    const [savedMapUrl, setSavedMapUrl] = React.useState<string | null>(null)

    React.useEffect(() => {
        const fetchProjects = async () => {
            try {
                const res = await fetch('/api/projects')
                const data = await res.json()
                if (data.success) {
                    setProjects(data.projects)
                    if (data.projects.length > 0) {
                        setSelectedProject(data.projects[0].id)
                    }
                }
            } catch (error) {
                console.error('Error fetching projects:', error)
            }
        }
        fetchProjects()
    }, [])

    // Handle file selection
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        if (!file.type.match(/^image\/(png|jpeg|svg\+xml)$/)) {
            alert('Solo se permiten archivos PNG, JPG o SVG')
            return
        }

        setMapFile(file)
        setMapPreview(URL.createObjectURL(file))
        setUploadStatus('idle')
    }

    // Handle drag and drop
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        const file = e.dataTransfer.files?.[0]
        if (file && file.type.match(/^image\/(png|jpeg|svg\+xml)$/)) {
            setMapFile(file)
            setMapPreview(URL.createObjectURL(file))
            setUploadStatus('idle')
        }
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
    }

    // Clear selection
    const clearSelection = () => {
        setMapFile(null)
        setMapPreview(null)
        setUploadStatus('idle')
    }

    // Upload to server
    const uploadMap = async () => {
        if (!mapFile) return

        setIsUploading(true)
        setUploadStatus('idle')

        try {
            const formData = new FormData()
            formData.append('file', mapFile)
            const project = projects.find(p => p.id === selectedProject)
            formData.append('projectName', project ? project.name : 'proyecto')
            formData.append('projectId', selectedProject)

            const response = await fetch('/api/admin/maps/upload', {
                method: 'POST',
                body: formData
            })

            if (!response.ok) {
                throw new Error('Error al subir el archivo')
            }

            const data = await response.json()
            setSavedMapUrl(data.url)
            setUploadStatus('success')
        } catch {
            setUploadStatus('error')
        } finally {
            setIsUploading(false)
        }
    }

    return (
        <div className="min-h-screen bg-grid">
            {/* Header */}
            <header className="glass-strong sticky top-0 z-40 border-b border-slate-700/50">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/admin">
                                <Button variant="ghost" size="sm">
                                    <ArrowLeft className="w-4 h-4" />
                                    Admin
                                </Button>
                            </Link>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                                    <Map className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-lg font-bold text-white">Configurar Plano</h1>
                                    <p className="text-xs text-slate-400">Subir imagen SVG o PNG del plano</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8 max-w-4xl">
                {/* Instructions */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileImage className="w-5 h-5 text-blue-400" />
                            Instrucciones
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-slate-400 space-y-2">
                        <p>1. Sube una imagen del plano de tu proyecto (PNG, JPG o SVG)</p>
                        <p>2. Recomendamos <strong className="text-white">SVG</strong> para mejor calidad en zoom</p>
                        <p>3. El tamaño máximo es 10MB</p>
                        <p>4. Después de subir, podrás configurar las coordenadas de cada lote</p>
                        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                            <p className="text-blue-300">
                                <strong>📁 Ubicación:</strong> Los archivos se guardan en <code className="bg-slate-800 px-2 py-0.5 rounded">/public/maps/</code>
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Project Selection */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="text-base">Seleccionar Proyecto</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <select
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500"
                            value={selectedProject}
                            onChange={(e) => setSelectedProject(e.target.value)}
                        >
                            <option value="" disabled>Selecciona un proyecto</option>
                            {projects.map(project => (
                                <option key={project.id} value={project.id}>
                                    {project.name}
                                </option>
                            ))}
                        </select>
                    </CardContent>
                </Card>

                {/* Upload Area */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Upload className="w-5 h-5 text-emerald-400" />
                            Subir Plano
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {!mapPreview ? (
                            <label
                                className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-slate-600 rounded-lg cursor-pointer hover:border-emerald-500 transition-colors"
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                            >
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <ImageIcon className="w-12 h-12 text-slate-400 mb-4" />
                                    <p className="text-lg text-slate-300 mb-2">
                                        Arrastra tu plano aquí
                                    </p>
                                    <p className="text-sm text-slate-500">
                                        o haz clic para seleccionar (PNG, JPG, SVG)
                                    </p>
                                </div>
                                <input
                                    type="file"
                                    accept=".png,.jpg,.jpeg,.svg,image/png,image/jpeg,image/svg+xml"
                                    className="hidden"
                                    onChange={handleFileSelect}
                                />
                            </label>
                        ) : (
                            <div className="relative">
                                <div className="absolute top-2 right-2 z-10 flex gap-2">
                                    <Button size="sm" variant="ghost" onClick={clearSelection}>
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                                <div className="border border-slate-600 rounded-lg overflow-hidden bg-slate-900">
                                    <>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={mapPreview}
                                            alt="Vista previa del plano"
                                            className="max-h-96 w-full object-contain"
                                        />
                                    </>
                                </div>
                                <div className="mt-3 flex items-center justify-between text-sm">
                                    <span className="text-slate-400">
                                        📄 {mapFile?.name} ({(mapFile?.size ? mapFile.size / 1024 / 1024 : 0).toFixed(2)} MB)
                                    </span>
                                    <span className="text-emerald-400 flex items-center gap-1">
                                        <Check className="w-4 h-4" />
                                        Listo para subir
                                    </span>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Status Messages */}
                {uploadStatus === 'error' && (
                    <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-rose-400" />
                        <p className="text-rose-400">Error al subir el archivo. Intenta de nuevo.</p>
                    </div>
                )}

                {uploadStatus === 'success' && (
                    <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                        <div className="flex items-center gap-3 mb-2">
                            <Check className="w-5 h-5 text-emerald-400" />
                            <p className="text-emerald-400 font-medium">¡Plano subido exitosamente!</p>
                        </div>
                        {savedMapUrl && (
                            <p className="text-sm text-slate-400">
                                Guardado en: <code className="bg-slate-800 px-2 py-0.5 rounded">{savedMapUrl}</code>
                            </p>
                        )}
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-4">
                    <Button
                        size="lg"
                        className="flex-1"
                        onClick={uploadMap}
                        isLoading={isUploading}
                        disabled={!mapFile}
                    >
                        <Upload className="w-5 h-5" />
                        Subir Plano
                    </Button>
                    {uploadStatus === 'success' && (
                        <Link href="/demo">
                            <Button size="lg" variant="outline">
                                <Eye className="w-5 h-5" />
                                Ver en Demo
                            </Button>
                        </Link>
                    )}
                </div>

                {/* Existing Maps */}
                <Card className="mt-8">
                    <CardHeader>
                        <CardTitle className="text-base">Planos guardados</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-slate-400 mb-4">
                            Los planos se están almacenando de manera segura en el servidor, en el directorio:
                        </p>
                        <code className="block bg-slate-800 p-4 rounded-lg text-emerald-400 font-mono text-sm leading-relaxed overflow-x-auto whitespace-pre">
                            /app/public/maps/
                        </code>
                        <div className="mt-4 p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                            <h4 className="text-orange-400 font-medium mb-1">⚠️ Importante para despliegues (Easypanel/Docker)</h4>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                Si estás utilizando un servidor como <strong>Easypanel</strong>, asegúrate de configurar un <strong className="text-white">&quot;Volume Mount&quot;</strong> en la pestaña <strong>Advanced</strong> o <strong>Storage</strong> de tu aplicación. 
                                <br/><br/>
                                Deberás montar la ruta <code className="bg-slate-800 px-1.5 py-0.5 rounded text-white text-xs">/app/public/maps</code> para evitar que los planos se borren con cada nueva actualización o reinicio del sistema.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}
