'use client'

import * as React from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import {
  ArrowLeft, Loader2, User, MapPin, DollarSign, FileSignature,
  AlertCircle, CheckCircle2, Clock, XCircle, ChevronRight,
  Mail, Phone, Home, CreditCard, Building2, UserCheck,
  FileText, Download
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Cuota {
  id: string
  numero: number
  descripcion: string | null
  monto: number
  fechaVenc: string
  fechaPago: string | null
  montoPagado: number | null
  estado: 'PENDIENTE' | 'PAGADO' | 'VENCIDO' | 'PARCIAL'
  metodoPago: string | null
  numOperacion: string | null
}

interface Contrato {
  id: string
  codigo: string
  lotId: string
  tipo: 'SEPARACION' | 'COMPRAVENTA'
  estado: 'BORRADOR' | 'ACTIVO' | 'FIRMADO' | 'CANCELADO'
  clienteNombres: string
  clienteApellidos: string
  clienteDni: string
  clienteEmail: string
  clientePhone: string | null
  clienteDomicilio: string | null
  clienteEstadoCivil: string | null
  precioTotal: number
  descuentoPct: number
  montoSeparacion: number | null
  inicial: number | null
  cuotasNum: number | null
  tasaAnual: number | null
  datos: any | null
  firmadoFisicamente: boolean
  fechaFirma: string | null
  lugarFirma: string | null
  createdAt: string
  updatedAt: string
  lot: { code: string; manzana: string; areaM2: number; loteNumero: number }
  user: { name: string; email: string }
  cuotas: Cuota[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtPEN(n: number) {
  return `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function timeAgo(d: string) {
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000)
  if (days === 0) return 'hoy'
  if (days === 1) return 'ayer'
  return `hace ${days}d`
}

function getInitials(nombres: string, apellidos: string) {
  const first = nombres.trim().charAt(0).toUpperCase()
  const last = apellidos.trim().charAt(0).toUpperCase()
  return `${first}${last}`
}

// ─── Badge components ─────────────────────────────────────────────────────────

function TipoBadge({ tipo }: { tipo: Contrato['tipo'] }) {
  if (tipo === 'SEPARACION') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        Separación
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
      Compraventa
    </span>
  )
}

function EstadoBadge({ estado, size = 'sm' }: { estado: Contrato['estado']; size?: 'sm' | 'lg' }) {
  const base = size === 'lg'
    ? 'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium'
    : 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium'

  const map: Record<Contrato['estado'], { cls: string; label: string; icon: React.ReactNode }> = {
    BORRADOR: {
      cls: 'bg-gray-100 text-gray-700',
      label: 'Borrador',
      icon: <Clock className={size === 'lg' ? 'w-4 h-4 mr-1.5' : 'w-3 h-3 mr-1'} />,
    },
    ACTIVO: {
      cls: 'bg-blue-100 text-blue-800',
      label: 'Activo',
      icon: <AlertCircle className={size === 'lg' ? 'w-4 h-4 mr-1.5' : 'w-3 h-3 mr-1'} />,
    },
    FIRMADO: {
      cls: 'bg-green-100 text-green-800',
      label: 'Firmado',
      icon: <CheckCircle2 className={size === 'lg' ? 'w-4 h-4 mr-1.5' : 'w-3 h-3 mr-1'} />,
    },
    CANCELADO: {
      cls: 'bg-red-100 text-red-800',
      label: 'Cancelado',
      icon: <XCircle className={size === 'lg' ? 'w-4 h-4 mr-1.5' : 'w-3 h-3 mr-1'} />,
    },
  }

  const { cls, label, icon } = map[estado]
  return (
    <span className={`${base} ${cls}`}>
      {icon}
      {label}
    </span>
  )
}

function CuotaEstadoChip({ estado }: { estado: Cuota['estado'] }) {
  const map: Record<Cuota['estado'], { cls: string; label: string }> = {
    PENDIENTE: { cls: 'bg-gray-100 text-gray-700', label: 'Pendiente' },
    PAGADO: { cls: 'bg-green-100 text-green-800', label: 'Pagado' },
    VENCIDO: { cls: 'bg-red-100 text-red-800', label: 'Vencido' },
    PARCIAL: { cls: 'bg-amber-100 text-amber-800', label: 'Parcial' },
  }
  const { cls, label } = map[estado]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {label}
    </span>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ContratoPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [contrato, setContrato] = React.useState<Contrato | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [notFound, setNotFound] = React.useState(false)
  const [updatingEstado, setUpdatingEstado] = React.useState(false)
  const [cancelConfirm, setCancelConfirm] = React.useState(false)

  // Fetch contrato
  React.useEffect(() => {
    if (!id) return
    setLoading(true)
    fetch(`/api/contratos/${id}`)
      .then((res) => {
        if (res.status === 404) { setNotFound(true); return null }
        return res.json()
      })
      .then((data) => {
        if (!data) return
        if (data.ok && data.contrato) {
          setContrato(data.contrato)
        } else {
          setNotFound(true)
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [id])

  // Change estado
  async function changeEstado(nuevoEstado: Contrato['estado']) {
    if (!contrato) return
    setUpdatingEstado(true)
    try {
      const res = await fetch(`/api/contratos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado }),
      })
      const data = await res.json()
      if (data.ok && data.contrato) {
        setContrato(data.contrato)
      }
    } finally {
      setUpdatingEstado(false)
      setCancelConfirm(false)
    }
  }

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      </div>
    )
  }

  // ── Not found ──
  if (notFound || !contrato) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <AlertCircle className="w-12 h-12 text-gray-400" />
          <p className="text-xl font-semibold text-gray-700">Contrato no encontrado</p>
          <Link
            href="/contratos"
            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a contratos
          </Link>
        </div>
      </div>
    )
  }

  const {
    codigo, tipo, estado, lotId,
    clienteNombres, clienteApellidos, clienteDni, clienteEmail,
    clientePhone, clienteDomicilio, clienteEstadoCivil,
    precioTotal, descuentoPct, montoSeparacion, inicial, cuotasNum, tasaAnual,
    firmadoFisicamente, fechaFirma, lugarFirma,
    createdAt, lot, user, cuotas,
  } = contrato

  const cuotasVencidas = cuotas.filter((c) => c.estado === 'VENCIDO').length
  const cuotasPagadas = cuotas.filter((c) => c.estado === 'PAGADO').length
  const cuotasPendientes = cuotas.filter((c) => c.estado === 'PENDIENTE' || c.estado === 'PARCIAL').length

  const showFirmaCard = firmadoFisicamente || !!fechaFirma || !!lugarFirma

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* ── Header ── */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
          <div className="flex items-center gap-3 mb-3">
            <Link
              href="/contratos"
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Contratos
            </Link>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{codigo}</h1>
            <TipoBadge tipo={tipo} />
            <EstadoBadge estado={estado} />
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

            {/* ═══════════════ COLUMNA IZQUIERDA ═══════════════ */}
            <div className="space-y-6">

              {/* Card Comprador */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Comprador
                </h2>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {getInitials(clienteNombres, clienteApellidos)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold text-gray-900">
                      {clienteNombres} {clienteApellidos}
                    </p>
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                      <CreditCard className="w-3.5 h-3.5" />
                      DNI: {clienteDni}
                    </p>
                    <div className="mt-3 space-y-1.5">
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        {clienteEmail}
                      </p>
                      {clientePhone && (
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          {clientePhone}
                        </p>
                      )}
                      {clienteDomicilio && (
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <Home className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          {clienteDomicilio}
                        </p>
                      )}
                      {clienteEstadoCivil && (
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <UserCheck className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          {clienteEstadoCivil}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Inmueble */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Inmueble
                </h2>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base font-semibold text-gray-900">Lote {lot.code}</span>
                    <span className="text-gray-300">·</span>
                    <span className="text-sm text-gray-600">Manzana {lot.manzana}</span>
                    <span className="text-gray-300">·</span>
                    <span className="text-sm text-gray-600">N° {lot.loteNumero}</span>
                  </div>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    {lot.areaM2} m²
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Asesor: <span className="text-gray-700 font-medium">{user.name}</span>
                  </p>
                </div>
              </div>

              {/* Card Condiciones financieras */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Condiciones financieras
                </h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Precio total</p>
                    <p className="text-2xl font-bold text-gray-900">{fmtPEN(precioTotal)}</p>
                  </div>

                  {descuentoPct > 0 && (
                    <div className="flex items-center justify-between py-2 border-t border-gray-100">
                      <span className="text-sm text-gray-600">Descuento aplicado</span>
                      <span className="text-sm font-medium text-green-700">
                        {descuentoPct}%
                      </span>
                    </div>
                  )}

                  {inicial != null && (
                    <div className="flex items-center justify-between py-2 border-t border-gray-100">
                      <span className="text-sm text-gray-600">Cuota inicial</span>
                      <span className="text-sm font-semibold text-gray-900">{fmtPEN(inicial)}</span>
                    </div>
                  )}

                  {cuotasNum != null ? (
                    <div className="flex items-center justify-between py-2 border-t border-gray-100">
                      <span className="text-sm text-gray-600">Financiamiento</span>
                      <span className="text-sm font-medium text-gray-800">
                        {cuotasNum} cuotas
                        {tasaAnual != null ? ` · Tasa ${tasaAnual}% anual` : ''}
                      </span>
                    </div>
                  ) : (
                    <div className="py-2 border-t border-gray-100">
                      <span className="text-sm text-gray-600">Pago único al contado</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <span className="text-xs text-gray-400">Creado el</span>
                    <span className="text-xs text-gray-500">{fmtDate(createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Card Firma */}
              {showFirmaCard && (
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <FileSignature className="w-4 h-4" />
                    Firma
                  </h2>
                  <div className="space-y-2">
                    {firmadoFisicamente ? (
                      <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-sm font-medium">Firmado físicamente</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-amber-600">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm font-medium">Pendiente de firma</span>
                      </div>
                    )}
                    {fechaFirma && (
                      <p className="text-sm text-gray-600">
                        Fecha: <span className="font-medium">{fmtDate(fechaFirma)}</span>
                      </p>
                    )}
                    {lugarFirma && (
                      <p className="text-sm text-gray-600">
                        Lugar: <span className="font-medium">{lugarFirma}</span>
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ═══════════════ COLUMNA DERECHA ═══════════════ */}
            <div className="space-y-6">

              {/* Card Estado del contrato */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                  Estado del contrato
                </h2>
                <div className="mb-5">
                  <EstadoBadge estado={estado} size="lg" />
                </div>

                {estado !== 'CANCELADO' && estado !== 'FIRMADO' && (
                  <div className="space-y-2">
                    {estado === 'BORRADOR' && (
                      <button
                        onClick={() => changeEstado('ACTIVO')}
                        disabled={updatingEstado}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        {updatingEstado ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                        Activar contrato
                      </button>
                    )}
                    {estado === 'ACTIVO' && (
                      <button
                        onClick={() => changeEstado('FIRMADO')}
                        disabled={updatingEstado}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        {updatingEstado ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                        Marcar como firmado
                      </button>
                    )}

                    {/* Cancel with confirmation */}
                    {!cancelConfirm ? (
                      <button
                        onClick={() => setCancelConfirm(true)}
                        disabled={updatingEstado}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-red-300 hover:bg-red-50 disabled:opacity-60 text-red-600 text-sm font-medium rounded-lg transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                        Cancelar contrato
                      </button>
                    ) : (
                      <div className="rounded-lg border border-red-200 bg-red-50 p-3 space-y-2">
                        <p className="text-sm text-red-700 font-medium">
                          ¿Confirmar cancelación?
                        </p>
                        <p className="text-xs text-red-600">Esta acción no se puede deshacer.</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => changeEstado('CANCELADO')}
                            disabled={updatingEstado}
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-xs font-medium rounded-md transition-colors"
                          >
                            {updatingEstado ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : null}
                            Sí, cancelar
                          </button>
                          <button
                            onClick={() => setCancelConfirm(false)}
                            disabled={updatingEstado}
                            className="flex-1 px-3 py-1.5 border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-medium rounded-md transition-colors"
                          >
                            No, volver
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Card Documentos */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                  Documentos
                </h2>
                <div className="space-y-2">
                  <a
                    href={`/dashboard/plantillas?contratoId=${id}`}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors"
                  >
                    <FileText className="w-4 h-4 text-blue-500" />
                    Ver modelo de contrato
                  </a>
                  <button
                    onClick={async () => {
                      try {
                        const r = await fetch('/api/contracts/generate', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            tipo,
                            lotId,
                            quotationId: null,
                            clienteData: {
                              dni:       clienteDni,
                              nombres:   clienteNombres,
                              apellidos: clienteApellidos,
                              email:     clienteEmail,
                              phone:     clientePhone ?? '',
                              domicilio: clienteDomicilio ?? '',
                            },
                            financialData: {
                              precioTotal,
                              montoSeparacion: montoSeparacion ?? undefined,
                              inicial:         inicial ?? undefined,
                              cuotas:          cuotasNum ?? undefined,
                              cuotaMensual:    cuotas[0]?.monto ?? undefined,
                              cronograma:      cuotas.map((c) => ({
                                numero: c.numero,
                                fecha: new Date(c.fechaVenc).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' }),
                                monto: c.monto,
                              })),
                            },
                          }),
                        })
                        const d = await r.json()
                        if (d.docxBase64) {
                          const link = document.createElement('a')
                          link.href = 'data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,' + d.docxBase64
                          link.download = `${codigo}.docx`
                          link.click()
                        } else {
                          alert('Error generando el documento: ' + (d.error ?? 'desconocido'))
                        }
                      } catch (err) {
                        alert('Error de conexión al generar el documento')
                      }
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Descargar contrato (.docx)
                  </button>
                </div>
              </div>

              {/* Card Cronograma de pagos */}
              {cuotas.length > 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100">
                    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                      Cronograma de pagos
                    </h2>
                  </div>

                  {/* Summary chips */}
                  <div className="px-5 py-3 flex items-center gap-3 flex-wrap border-b border-gray-100 bg-gray-50">
                    {cuotasVencidas > 0 && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <AlertCircle className="w-3 h-3" />
                        {cuotasVencidas} vencida{cuotasVencidas !== 1 ? 's' : ''}
                      </span>
                    )}
                    {cuotasPendientes > 0 && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                        <Clock className="w-3 h-3" />
                        {cuotasPendientes} próxima{cuotasPendientes !== 1 ? 's' : ''}
                      </span>
                    )}
                    {cuotasPagadas > 0 && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle2 className="w-3 h-3" />
                        {cuotasPagadas} pagada{cuotasPagadas !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs text-gray-500 bg-gray-50 border-b border-gray-100">
                          <th className="text-left px-4 py-2.5 font-medium">N°</th>
                          <th className="text-left px-4 py-2.5 font-medium">Descripción</th>
                          <th className="text-left px-4 py-2.5 font-medium">Vencimiento</th>
                          <th className="text-right px-4 py-2.5 font-medium">Monto</th>
                          <th className="text-center px-4 py-2.5 font-medium">Estado</th>
                          <th className="text-right px-4 py-2.5 font-medium">Pagado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {cuotas.map((cuota) => (
                          <tr key={cuota.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 text-gray-700 font-medium">{cuota.numero}</td>
                            <td className="px-4 py-3 text-gray-600 max-w-[140px] truncate">
                              {cuota.descripcion ?? '—'}
                            </td>
                            <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                              <div>{fmtDate(cuota.fechaVenc)}</div>
                              {cuota.estado === 'VENCIDO' && (
                                <div className="text-xs text-red-500">{timeAgo(cuota.fechaVenc)}</div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right text-gray-900 font-medium whitespace-nowrap">
                              {fmtPEN(cuota.monto)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <CuotaEstadoChip estado={cuota.estado} />
                            </td>
                            <td className="px-4 py-3 text-right text-gray-600 whitespace-nowrap">
                              {cuota.montoPagado != null ? fmtPEN(cuota.montoPagado) : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : tipo === 'COMPRAVENTA' ? (
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex flex-col items-center gap-2 text-center">
                  <Clock className="w-8 h-8 text-gray-300" />
                  <p className="text-sm font-medium text-gray-500">Sin cronograma generado</p>
                  <p className="text-xs text-gray-400">Este contrato aún no tiene cuotas registradas.</p>
                </div>
              ) : null}

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
