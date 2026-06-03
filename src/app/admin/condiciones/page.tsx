'use client'

import * as React from 'react'
import Link from 'next/link'
import { ArrowLeft, Save, Plus, Trash2, Loader2, CheckCircle2, Settings2, Percent, Clock, Users } from 'lucide-react'

interface Aprobador { id: string; nombre: string; cargo: string }

interface Condiciones {
  descuentoContadoMax: number
  descuentoFinancMax: number
  descuentoExcepMax: number
  tasaDefault: number
  plazoMax: number
  inicialMinPct: number
  tiempoAprobSeg: number
  penalidad: number
  lucroCesante: number
  aprobadores: Aprobador[]
}

const DEFAULTS: Condiciones = {
  descuentoContadoMax: 5, descuentoFinancMax: 3, descuentoExcepMax: 10,
  tasaDefault: 8, plazoMax: 60, inicialMinPct: 10,
  tiempoAprobSeg: 120, penalidad: 0.5, lucroCesante: 0.5,
  aprobadores: []
}

export default function CondicionesPage() {
  const [data, setData] = React.useState<Condiciones>(DEFAULTS)
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [saved, setSaved] = React.useState(false)

  React.useEffect(() => {
    fetch('/api/admin/condiciones').then(r => r.json()).then(d => {
      if (d.condiciones) {
        setData({
          descuentoContadoMax: d.condiciones.descuentoContadoMax,
          descuentoFinancMax: d.condiciones.descuentoFinancMax,
          descuentoExcepMax: d.condiciones.descuentoExcepMax,
          tasaDefault: d.condiciones.tasaDefault,
          plazoMax: d.condiciones.plazoMax,
          inicialMinPct: d.condiciones.inicialMinPct,
          tiempoAprobSeg: d.condiciones.tiempoAprobSeg,
          penalidad: d.condiciones.penalidad,
          lucroCesante: d.condiciones.lucroCesante,
          aprobadores: (d.condiciones.aprobadores as Aprobador[]) || [],
        })
      }
    }).finally(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      await fetch('/api/admin/condiciones', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally { setSaving(false) }
  }

  const num = (key: keyof Condiciones) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setData(prev => ({ ...prev, [key]: parseFloat(e.target.value) || 0 }))

  const addAprobador = () => setData(prev => ({
    ...prev,
    aprobadores: [...prev.aprobadores, { id: Date.now().toString(), nombre: '', cargo: '' }]
  }))
  const removeAprobador = (id: string) => setData(prev => ({
    ...prev, aprobadores: prev.aprobadores.filter(a => a.id !== id)
  }))
  const updateAprobador = (id: string, field: 'nombre' | 'cargo', value: string) =>
    setData(prev => ({
      ...prev,
      aprobadores: prev.aprobadores.map(a => a.id === id ? { ...a, [field]: value } : a)
    }))

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-4">
            <ArrowLeft className="w-3.5 h-3.5" /> Panel Admin
          </Link>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center">
                <Settings2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Condiciones Comerciales</h1>
                <p className="text-sm text-gray-500">Define los topes de descuento, plazos y aprobadores</p>
              </div>
            </div>
            <button
              onClick={save} disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              {saved ? '¡Guardado!' : 'Guardar cambios'}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Descuentos */}
          <Section icon={<Percent className="w-4 h-4 text-blue-600" />} title="Topes de descuento">
            <div className="grid grid-cols-3 gap-4">
              <Field label="Contado máx (S/)" hint="Monto máximo de descuento">
                <NumberInput value={data.descuentoContadoMax} onChange={num('descuentoContadoMax')} min={0} max={999999} step={500} />
              </Field>
              <Field label="Financiamiento máx (S/)" hint="Monto máximo con financiamiento">
                <NumberInput value={data.descuentoFinancMax} onChange={num('descuentoFinancMax')} min={0} max={999999} step={500} />
              </Field>
              <Field label="Excepción máx (S/)" hint="Requiere aprobación del supervisor">
                <NumberInput value={data.descuentoExcepMax} onChange={num('descuentoExcepMax')} min={0} max={999999} step={1000} />
              </Field>
            </div>
            <InfoBox text="Nivel 1: el asesor aplica hasta el monto de contado/financiamiento. Nivel 2: solicita excepción (requiere aprobación). Nivel 3: VB gerencial (elige aprobador)." />
          </Section>

          {/* Financiamiento */}
          <Section icon={<Settings2 className="w-4 h-4 text-green-600" />} title="Condiciones de financiamiento">
            <div className="grid grid-cols-3 gap-4">
              <Field label="Tasa anual por defecto" hint="Porcentaje anual — ej. 12">
                <NumberInput value={data.tasaDefault} onChange={num('tasaDefault')} min={0} max={30} step={0.5} />
              </Field>
              <Field label="Plazo máximo (meses)" hint="Ej. 36 o 60">
                <NumberInput value={data.plazoMax} onChange={num('plazoMax')} min={6} max={240} step={6} />
              </Field>
              <Field label="Inicial mínima (S/)" hint="Monto mínimo de cuota inicial">
                <NumberInput value={data.inicialMinPct} onChange={num('inicialMinPct')} min={0} max={999999} step={500} />
              </Field>
            </div>
          </Section>

          {/* Mora */}
          <Section icon={<Clock className="w-4 h-4 text-amber-600" />} title="Penalidad y mora">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Penalidad por mora (S/ mensual)">
                <NumberInput value={data.penalidad} onChange={num('penalidad')} min={0} max={99999} step={50} />
              </Field>
              <Field label="Lucro cesante (S/ mensual)">
                <NumberInput value={data.lucroCesante} onChange={num('lucroCesante')} min={0} max={99999} step={50} />
              </Field>
            </div>
          </Section>

          {/* Aprobaciones */}
          <Section icon={<Users className="w-4 h-4 text-purple-600" />} title="Aprobadores de descuento">
            <div className="mb-3">
              <Field label="Tiempo de aprobación (segundos)" hint="Para excepciones nivel 2">
                <NumberInput value={data.tiempoAprobSeg} onChange={num('tiempoAprobSeg')} min={30} max={600} step={30} />
              </Field>
            </div>
            <div className="space-y-2">
              {data.aprobadores.map(a => (
                <div key={a.id} className="flex gap-2">
                  <input
                    placeholder="Nombre del aprobador"
                    value={a.nombre}
                    onChange={e => updateAprobador(a.id, 'nombre', e.target.value)}
                    className="flex-1 px-3 h-9 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                  />
                  <input
                    placeholder="Cargo (ej. Gerente General)"
                    value={a.cargo}
                    onChange={e => updateAprobador(a.id, 'cargo', e.target.value)}
                    className="flex-1 px-3 h-9 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                  />
                  <button onClick={() => removeAprobador(a.id)}
                    className="p-2.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button onClick={addAprobador}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors">
                <Plus className="w-3.5 h-3.5" /> Agregar aprobador
              </button>
            </div>
          </Section>
        </div>
      </div>
    </div>
  )
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-4">
        {icon} {title}
      </h2>
      {children}
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">
        {label}{hint && <span className="text-gray-400 font-normal"> — {hint}</span>}
      </label>
      {children}
    </div>
  )
}

function NumberInput({ value, onChange, min, max, step }: {
  value: number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  min?: number; max?: number; step?: number
}) {
  return (
    <input
      type="number" value={value} onChange={onChange}
      min={min} max={max} step={step}
      className="w-full px-3 h-9 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
    />
  )
}

function InfoBox({ text }: { text: string }) {
  return (
    <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700">
      {text}
    </div>
  )
}
