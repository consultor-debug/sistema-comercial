'use client'

import * as React from 'react'
import { Sidebar } from '@/components/Sidebar'
import { cn } from '@/lib/utils'
import {
    Loader2, Search, UserCheck, Phone, Mail, MapPin,
    FileText, DollarSign, ChevronRight, BadgeCheck
} from 'lucide-react'

interface Cliente {
    dni: string
    nombres: string
    apellidos: string
    email: string
    phone: string | null
    domicilio: string | null
    estadoCivil: string | null
    contratos: {
        id: string
        codigo: string
        tipo: 'SEPARACION' | 'COMPRAVENTA'
        estado: 'BORRADOR' | 'ACTIVO' | 'FIRMADO' | 'CANCELADO'
        precioTotal: number
        createdAt: string
        lot: { code: string; manzana: string; areaM2: number }
    }[]
}

const ESTADO_BADGE: Record<string, string> = {
    BORRADOR:  'bg-gray-100 text-gray-500 border-gray-200',
    ACTIVO:    'bg-blue-50 text-blue-700 border-blue-200',
    FIRMADO:   'bg-emerald-50 text-emerald-700 border-emerald-200',
    CANCELADO: 'bg-rose-50 text-rose-600 border-rose-200',
}
const TIPO_LABEL: Record<string, string> = { SEPARACION: 'Sep.', COMPRAVENTA: 'C.V.' }

function formatSoles(n: number) {
    return `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const days = Math.floor(diff / 86400000)
    if (days === 0) return 'hoy'
    if (days === 1) return 'ayer'
    if (days < 30) return `hace ${days}d`
    const months = Math.floor(days / 30)
    return `hace ${months}m`
}

export default function ClientesPage() {
    const [clientes, setClientes] = React.useState<Cliente[]>([])
    const [loading, setLoading]   = React.useState(true)
    const [search, setSearch]     = React.useState('')
    const [selected, setSelected] = React.useState<Cliente | null>(null)

    React.useEffect(() => {
        fetch('/api/contratos')
            .then(r => r.json())
            .then(d => {
                if (!d.ok) return
                // Agrupar contratos por DNI
                const map = new Map<string, Cliente>()
                for (const c of d.contratos) {
                    const key = c.clienteDni
                    if (!map.has(key)) {
                        map.set(key, {
                            dni:         c.clienteDni,
                            nombres:     c.clienteNombres,
                            apellidos:   c.clienteApellidos,
                            email:       c.clienteEmail,
                            phone:       c.clientePhone,
                            domicilio:   c.clienteDomicilio,
                            estadoCivil: c.clienteEstadoCivil,
                            contratos:   [],
                        })
                    }
                    map.get(key)!.contratos.push({
                        id:         c.id,
                        codigo:     c.codigo,
                        tipo:       c.tipo,
                        estado:     c.estado,
                        precioTotal: c.precioTotal,
                        createdAt:  c.createdAt,
                        lot:        c.lot,
                    })
                }
                setClientes(Array.from(map.values()))
            })
            .finally(() => setLoading(false))
    }, [])

    const filtered = React.useMemo(() => {
        if (!search) return clientes
        const q = search.toLowerCase()
        return clientes.filter(c =>
            c.nombres.toLowerCase().includes(q) ||
            c.apellidos.toLowerCase().includes(q) ||
            c.dni.includes(q) ||
            c.email.toLowerCase().includes(q)
        )
    }, [clientes, search])

    const stats = {
        total:    clientes.length,
        activos:  clientes.filter(c => c.contratos.some(x => x.estado === 'ACTIVO')).length,
        firmados: clientes.filter(c => c.contratos.some(x => x.estado === 'FIRMADO')).length,
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <Sidebar />
            <div className="flex-1 md:pl-52 flex flex-col">

                {/* Header */}
                <div className="bg-white border-b border-gray-200 px-6 py-5 shrink-0">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">Clientes</h1>
                            <p className="text-sm text-gray-500 mt-0.5">
                                {stats.total} compradores · {stats.activos} contratos activos · {stats.firmados} firmados
                            </p>
                        </div>
                        {/* Stats */}
                        <div className="hidden sm:flex items-center gap-4 shrink-0">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                                <div className="text-xs text-gray-400">Total</div>
                            </div>
                            <div className="w-px h-8 bg-gray-200" />
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">{stats.activos}</div>
                                <div className="text-xs text-gray-400">Activos</div>
                            </div>
                            <div className="w-px h-8 bg-gray-200" />
                            <div className="text-center">
                                <div className="text-2xl font-bold text-emerald-600">{stats.firmados}</div>
                                <div className="text-xs text-gray-400">Firmados</div>
                            </div>
                        </div>
                    </div>

                    {/* Buscador */}
                    <div className="mt-4 relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Buscar por nombre, DNI o correo…"
                            className="w-full pl-9 pr-4 h-9 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                        />
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 flex overflow-hidden">

                    {/* Lista */}
                    <div className={cn(
                        'flex-1 overflow-y-auto',
                        selected ? 'hidden md:block md:w-1/2 lg:w-3/5' : 'w-full'
                    )}>
                        {loading ? (
                            <div className="flex items-center justify-center h-48">
                                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-center px-4">
                                <UserCheck className="w-10 h-10 text-gray-300 mb-3" />
                                <p className="text-gray-500 font-medium">
                                    {search ? 'Sin resultados para esa búsqueda' : 'Aún no hay clientes registrados'}
                                </p>
                                {!search && (
                                    <p className="text-gray-400 text-sm mt-1">
                                        Los clientes aparecen automáticamente al crear contratos
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {filtered.map(c => (
                                    <button
                                        key={c.dni}
                                        onClick={() => setSelected(s => s?.dni === c.dni ? null : c)}
                                        className={cn(
                                            'w-full text-left px-6 py-4 hover:bg-gray-50 transition-colors flex items-center gap-4',
                                            selected?.dni === c.dni && 'bg-blue-50 hover:bg-blue-50'
                                        )}
                                    >
                                        {/* Avatar */}
                                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm flex items-center justify-center shrink-0">
                                            {c.nombres.charAt(0)}{c.apellidos.charAt(0)}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-gray-900 text-sm">
                                                    {c.nombres} {c.apellidos}
                                                </span>
                                                {c.contratos.some(x => x.estado === 'FIRMADO') && (
                                                    <BadgeCheck className="w-3.5 h-3.5 text-emerald-500" />
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-3">
                                                <span>DNI {c.dni}</span>
                                                <span>{c.email}</span>
                                            </div>
                                        </div>

                                        {/* Contratos badges */}
                                        <div className="flex items-center gap-2 shrink-0">
                                            <div className="flex gap-1.5">
                                                {c.contratos.slice(0, 3).map(x => (
                                                    <span
                                                        key={x.id}
                                                        className={cn(
                                                            'text-[10px] font-medium px-1.5 py-0.5 rounded border',
                                                            ESTADO_BADGE[x.estado]
                                                        )}
                                                    >
                                                        {TIPO_LABEL[x.tipo]}
                                                    </span>
                                                ))}
                                                {c.contratos.length > 3 && (
                                                    <span className="text-[10px] text-gray-400">+{c.contratos.length - 3}</span>
                                                )}
                                            </div>
                                            <ChevronRight className={cn(
                                                'w-4 h-4 text-gray-300 transition-transform',
                                                selected?.dni === c.dni && 'rotate-90 text-blue-500'
                                            )} />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Panel de detalle */}
                    {selected && (
                        <div className="w-full md:w-1/2 lg:w-2/5 border-l border-gray-200 bg-white overflow-y-auto flex flex-col">
                            {/* Header del panel */}
                            <div className="px-6 py-5 border-b border-gray-100">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 font-bold text-base flex items-center justify-center">
                                            {selected.nombres.charAt(0)}{selected.apellidos.charAt(0)}
                                        </div>
                                        <div>
                                            <h2 className="font-bold text-gray-900">
                                                {selected.nombres} {selected.apellidos}
                                            </h2>
                                            <p className="text-xs text-gray-500">DNI {selected.dni}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelected(null)}
                                        className="text-gray-400 hover:text-gray-600 text-lg leading-none"
                                    >
                                        ×
                                    </button>
                                </div>

                                {/* Datos de contacto */}
                                <div className="mt-4 space-y-1.5">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                                        <a href={`mailto:${selected.email}`} className="hover:text-blue-600 transition-colors">
                                            {selected.email}
                                        </a>
                                    </div>
                                    {selected.phone && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Phone className="w-3.5 h-3.5 text-gray-400" />
                                            <a href={`tel:${selected.phone}`} className="hover:text-blue-600 transition-colors">
                                                {selected.phone}
                                            </a>
                                        </div>
                                    )}
                                    {selected.domicilio && (
                                        <div className="flex items-start gap-2 text-sm text-gray-600">
                                            <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                                            <span>{selected.domicilio}</span>
                                        </div>
                                    )}
                                    {selected.estadoCivil && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <UserCheck className="w-3.5 h-3.5 text-gray-400" />
                                            <span className="capitalize">{selected.estadoCivil}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Contratos del cliente */}
                            <div className="flex-1 px-6 py-4">
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                                    Contratos ({selected.contratos.length})
                                </h3>
                                <div className="space-y-3">
                                    {selected.contratos.map(c => (
                                        <a
                                            key={c.id}
                                            href={`/contratos/${c.id}`}
                                            className="block p-3 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/30 transition-colors"
                                        >
                                            <div className="flex items-center justify-between mb-1.5">
                                                <div className="flex items-center gap-2">
                                                    <FileText className="w-3.5 h-3.5 text-gray-400" />
                                                    <span className="text-xs font-semibold text-gray-700">{c.codigo}</span>
                                                </div>
                                                <span className={cn(
                                                    'text-[10px] font-medium px-1.5 py-0.5 rounded border',
                                                    ESTADO_BADGE[c.estado]
                                                )}>
                                                    {c.estado}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-xs text-gray-500">
                                                <span>Mz {c.lot.manzana} · Lote {c.lot.code} · {c.lot.areaM2}m²</span>
                                                <span>{timeAgo(c.createdAt)}</span>
                                            </div>
                                            <div className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-gray-800">
                                                <DollarSign className="w-3 h-3 text-gray-400" />
                                                {formatSoles(c.precioTotal)}
                                                <span className="ml-1 text-[10px] font-normal text-gray-400">
                                                    {c.tipo === 'COMPRAVENTA' ? 'Compraventa' : 'Separación'}
                                                </span>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
