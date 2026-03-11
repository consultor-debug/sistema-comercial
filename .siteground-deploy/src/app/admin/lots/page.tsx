'use client'

import * as React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import {
    Building2, Upload, FileSpreadsheet, Map, Check,
    ArrowLeft, AlertCircle, Database, Image
} from 'lucide-react'

type LotRow = {
    id: string
    manzana: string
    loteNumero: number
    tipologia: string
    frente: string
    ladoDerecho: string
    ladoIzquierdo: string
    fondo: string
    area: number
    etapa: string
    precioContado: number
    precioFinanciado: number
    precioFinal: number
    estado: string
    fechaSeparacion: string
    fechaCierre: string
    tipoFinanciamiento: string
    asesor: string
}

export default function AdminLotsPage() {
    const [projects, setProjects] = React.useState<{ id: string; name: string }[]>([])
    const [selectedProjectId, setSelectedProjectId] = React.useState<string>('')
    const [lots, setLots] = React.useState<LotRow[]>([])
    const [csvText, setCsvText] = React.useState('')
    const [isProcessing, setIsProcessing] = React.useState(false)
    const [uploadStatus, setUploadStatus] = React.useState<'idle' | 'success' | 'error'>('idle')
    const [errorMessage, setErrorMessage] = React.useState('')
    const [googleSheetUrl, setGoogleSheetUrl] = React.useState('')

    React.useEffect(() => {
        fetchProjects()
    }, [])

    const fetchProjects = async () => {
        try {
            const res = await fetch('/api/projects')
            const data = await res.json()
            if (data.success) {
                setProjects(data.projects)
                if (data.projects.length > 0) {
                    setSelectedProjectId(data.projects[0].id)
                }
            }
        } catch (error) {
            console.error('Error fetching projects:', error)
        }
    }

    // Parse number that uses comma as decimal separator
    const parseNumber = (value: string): number => {
        if (!value) return 0
        // Remove quotes and replace comma with period
        const cleaned = value.replace(/"/g, '').replace(',', '.')
        return parseFloat(cleaned) || 0
    }

    // Map estado from Spanish to system status
    const mapEstado = (estado: string): string => {
        const normalized = estado.toLowerCase().trim()
        if (normalized.includes('libre')) return 'LIBRE'
        if (normalized.includes('vendido')) return 'VENDIDO'
        if (normalized.includes('separado')) return 'SEPARADO'
        if (normalized.includes('no disponible')) return 'NO_DISPONIBLE'
        return 'NO_DISPONIBLE'
    }

    // Parse CSV data
    const parseCSV = (csv: string): LotRow[] => {
        const lines = csv.split('\n').filter(line => line.trim())
        if (lines.length < 2) return []

        // Skip header
        const dataLines = lines.slice(1)

        return dataLines.map(line => {
            // Handle CSV with quoted values containing commas
            const values: string[] = []
            let current = ''
            let inQuotes = false

            for (const char of line) {
                if (char === '"') {
                    inQuotes = !inQuotes
                } else if (char === ',' && !inQuotes) {
                    values.push(current.trim())
                    current = ''
                } else {
                    current += char
                }
            }
            values.push(current.trim())

            return {
                id: values[0] || '',
                manzana: values[1] || '',
                loteNumero: parseInt(values[2]) || 0,
                tipologia: values[3] || '',
                frente: values[4] || '',
                ladoDerecho: values[5] || '',
                ladoIzquierdo: values[6] || '',
                fondo: values[7] || '',
                area: parseNumber(values[8]),
                etapa: values[9] || '',
                precioContado: parseNumber(values[10]),
                precioFinanciado: parseNumber(values[11]),
                precioFinal: parseNumber(values[12]),
                estado: values[13] || '',
                fechaSeparacion: values[14] || '',
                fechaCierre: values[15] || '',
                tipoFinanciamiento: values[16] || '',
                asesor: values[17] || ''
            }
        }).filter(lot => lot.id)
    }

    // Handle file upload
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (event) => {
            const text = event.target?.result as string
            setCsvText(text)
            const parsed = parseCSV(text)
            setLots(parsed)
            setUploadStatus('idle')
        }
        reader.readAsText(file)
    }

    // Fetch from Google Sheets
    const fetchFromGoogleSheets = async () => {
        if (!googleSheetUrl) return

        try {
            setIsProcessing(true)
            // Extract sheet ID from URL
            const match = googleSheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/)
            if (!match) {
                setErrorMessage('URL de Google Sheets inválida')
                setUploadStatus('error')
                return
            }

            const sheetId = match[1]
            const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`

            const response = await fetch(exportUrl)
            if (!response.ok) {
                throw new Error('No se pudo acceder al documento. Asegúrate de que sea público.')
            }

            const text = await response.text()
            setCsvText(text)
            const parsed = parseCSV(text)
            setLots(parsed)
            setUploadStatus('idle')
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Error al cargar datos')
            setUploadStatus('error')
        } finally {
            setIsProcessing(false)
        }
    }

    // Save lots to database
    const saveLots = async () => {
        if (!selectedProjectId) {
            alert('Por favor selecciona un proyecto primero')
            return
        }

        setIsProcessing(true)
        setUploadStatus('idle')
        setErrorMessage('')

        try {
            const response = await fetch('/api/admin/lots/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId: selectedProjectId,
                    lots: lots.map(lot => ({
                        ...lot,
                        estado: mapEstado(lot.estado),
                        frente: parseNumber(lot.frente),
                        ladoDerecho: parseNumber(lot.ladoDerecho),
                        ladoIzquierdo: parseNumber(lot.ladoIzquierdo),
                        fondo: parseNumber(lot.fondo)
                    }))
                })
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Error al guardar lotes')
            }

            setUploadStatus('success')
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Error desconocido')
            setUploadStatus('error')
        } finally {
            setIsProcessing(false)
        }
    }

    // Count by status
    const statusCounts = lots.reduce((acc, lot) => {
        const status = mapEstado(lot.estado)
        acc[status] = (acc[status] || 0) + 1
        return acc
    }, {} as Record<string, number>)

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
                                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                                    <Database className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-lg font-bold text-white">Importar Lotes</h1>
                                    <p className="text-xs text-slate-400">Cargar inventario desde CSV o Google Sheets</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8 max-w-4xl">
                {/* Project Selection */}
                <Card className="mb-6 border-blue-500/30">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-blue-400" />
                            1. Seleccionar Proyecto
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <select
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            value={selectedProjectId}
                            onChange={(e) => setSelectedProjectId(e.target.value)}
                        >
                            {projects.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                        {projects.length === 0 && (
                            <p className="text-xs text-amber-400 mt-2">
                                No hay proyectos creados. <Link href="/admin/projects/new" className="underline">Crea uno primero</Link>.
                            </p>
                        )}
                    </CardContent>
                </Card>
                {/* Instructions */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileSpreadsheet className="w-5 h-5 text-blue-400" />
                            Formato de datos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-slate-400 mb-3">
                            El archivo CSV debe tener las siguientes columnas:
                        </p>
                        <div className="bg-slate-800 rounded-lg p-3 text-xs font-mono text-slate-300 overflow-x-auto">
                            ID, MANZANA, LOTE N°, TIPOLOGIA, FRENTE, LADO DERECHO, LADO IZQUIERDO, FONDO, ÁREA (m2), ETAPA, PRECIO CONTADO, PRECIO FINANCIADO, PRECIO FINAL, Estado, F. Separación, F. Cierre, T. Financiamiento, Asesor
                        </div>
                    </CardContent>
                </Card>

                {/* Import Methods */}
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                    {/* File Upload */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Upload className="w-5 h-5 text-emerald-400" />
                                Subir archivo CSV
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-600 rounded-lg cursor-pointer hover:border-emerald-500 transition-colors">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <FileSpreadsheet className="w-8 h-8 text-slate-400 mb-2" />
                                    <p className="text-sm text-slate-400">
                                        Haz clic o arrastra un archivo CSV
                                    </p>
                                </div>
                                <input
                                    type="file"
                                    accept=".csv"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                />
                            </label>
                        </CardContent>
                    </Card>

                    {/* Google Sheets */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <FileSpreadsheet className="w-5 h-5 text-blue-400" />
                                Desde Google Sheets
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Input
                                placeholder="https://docs.google.com/spreadsheets/d/..."
                                value={googleSheetUrl}
                                onChange={(e) => setGoogleSheetUrl(e.target.value)}
                                className="mb-3"
                            />
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={fetchFromGoogleSheets}
                                isLoading={isProcessing}
                            >
                                Cargar desde Google Sheets
                            </Button>
                            <p className="text-xs text-slate-500 mt-2">
                                El documento debe ser público o compartido con acceso de lectura.
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Preview */}
                {lots.length > 0 && (
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <Check className="w-5 h-5 text-emerald-400" />
                                    Vista previa ({lots.length} lotes)
                                </span>
                                <div className="flex gap-2">
                                    <Badge variant="success">{statusCounts.LIBRE || 0} Libres</Badge>
                                    <Badge variant="warning">{statusCounts.SEPARADO || 0} Separados</Badge>
                                    <Badge variant="danger">{statusCounts.VENDIDO || 0} Vendidos</Badge>
                                    <Badge variant="neutral">{statusCounts.NO_DISPONIBLE || 0} No disp.</Badge>
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="max-h-80 overflow-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-800 sticky top-0">
                                        <tr>
                                            <th className="px-3 py-2 text-left text-slate-300">ID</th>
                                            <th className="px-3 py-2 text-left text-slate-300">Manzana</th>
                                            <th className="px-3 py-2 text-left text-slate-300">Lote</th>
                                            <th className="px-3 py-2 text-left text-slate-300">Área</th>
                                            <th className="px-3 py-2 text-left text-slate-300">Precio</th>
                                            <th className="px-3 py-2 text-left text-slate-300">Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {lots.slice(0, 20).map((lot, i) => (
                                            <tr key={i} className="border-b border-slate-700 hover:bg-slate-800/50">
                                                <td className="px-3 py-2 text-white">{lot.id}</td>
                                                <td className="px-3 py-2 text-slate-300">{lot.manzana}</td>
                                                <td className="px-3 py-2 text-slate-300">{lot.loteNumero}</td>
                                                <td className="px-3 py-2 text-slate-300">{lot.area} m²</td>
                                                <td className="px-3 py-2 text-emerald-400">S/ {lot.precioFinal.toLocaleString()}</td>
                                                <td className="px-3 py-2">
                                                    <Badge
                                                        variant={
                                                            mapEstado(lot.estado) === 'LIBRE' ? 'success' :
                                                                mapEstado(lot.estado) === 'SEPARADO' ? 'warning' :
                                                                    mapEstado(lot.estado) === 'VENDIDO' ? 'danger' : 'neutral'
                                                        }
                                                        size="sm"
                                                    >
                                                        {lot.estado}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {lots.length > 20 && (
                                    <p className="text-center text-slate-500 py-3">
                                        ...y {lots.length - 20} lotes más
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Status Messages */}
                {uploadStatus === 'error' && (
                    <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-rose-400" />
                        <p className="text-rose-400">{errorMessage}</p>
                    </div>
                )}

                {uploadStatus === 'success' && (
                    <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center gap-3">
                        <Check className="w-5 h-5 text-emerald-400" />
                        <p className="text-emerald-400">¡Lotes importados exitosamente!</p>
                    </div>
                )}

                {/* Save Button */}
                {lots.length > 0 && (
                    <div className="flex gap-4">
                        <Button
                            size="lg"
                            className="flex-1"
                            onClick={saveLots}
                            isLoading={isProcessing}
                        >
                            <Database className="w-5 h-5" />
                            Guardar {lots.length} lotes en la base de datos
                        </Button>
                        <Link href="/admin/lots/map">
                            <Button size="lg" variant="outline">
                                <Map className="w-5 h-5" />
                                Configurar Mapa
                            </Button>
                        </Link>
                    </div>
                )}
            </main>
        </div>
    )
}
