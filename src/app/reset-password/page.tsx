'use client'

import * as React from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { Building2, Lock, ArrowLeft, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react'

function ResetPasswordContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const token = searchParams.get('token')

    const [password, setPassword] = React.useState('')
    const [confirm, setConfirm] = React.useState('')
    const [showPw, setShowPw] = React.useState(false)
    const [isLoading, setIsLoading] = React.useState(false)
    const [success, setSuccess] = React.useState(false)
    const [error, setError] = React.useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        if (password !== confirm) {
            setError('Las contraseñas no coinciden')
            return
        }
        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres')
            return
        }
        setIsLoading(true)
        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            })
            const data = await res.json()
            if (!data.ok) throw new Error(data.error || 'Error')
            setSuccess(true)
            setTimeout(() => router.push('/login'), 3000)
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Error al restablecer')
        } finally {
            setIsLoading(false)
        }
    }

    if (!token) {
        return (
            <div className="min-h-screen bg-grid flex items-center justify-center p-6">
                <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-4" />
                    <h2 className="text-lg font-semibold text-white mb-2">Enlace inválido</h2>
                    <p className="text-slate-400 mb-6 text-sm">Este enlace de recuperación no es válido.</p>
                    <Link href="/forgot-password" className="text-blue-400 hover:underline text-sm">
                        Solicitar nuevo enlace
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-grid flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-3">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                            <Building2 className="w-8 h-8 text-white" />
                        </div>
                    </Link>
                    <h1 className="mt-4 text-2xl font-bold text-white">Sistema Comercial</h1>
                    <p className="text-slate-400">Nueva contraseña</p>
                </div>

                <div className="bg-slate-900/60 backdrop-blur-sm border border-white/8 rounded-2xl p-8">
                    {success ? (
                        <div className="text-center py-4">
                            <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                            </div>
                            <h2 className="text-lg font-semibold text-white mb-2">¡Contraseña actualizada!</h2>
                            <p className="text-sm text-slate-400">Redirigiendo al login en unos segundos...</p>
                        </div>
                    ) : (
                        <>
                            <h2 className="text-lg font-semibold text-white mb-1">Crear nueva contraseña</h2>
                            <p className="text-sm text-slate-400 mb-6">Elige una contraseña segura de al menos 6 caracteres.</p>

                            {error && (
                                <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center gap-2 text-sm text-rose-400">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Nueva contraseña</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                        <input
                                            type={showPw ? 'text' : 'password'}
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            required
                                            minLength={6}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 pl-9 pr-10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-600"
                                        />
                                        <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                                            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Confirmar contraseña</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                        <input
                                            type={showPw ? 'text' : 'password'}
                                            value={confirm}
                                            onChange={e => setConfirm(e.target.value)}
                                            placeholder="••••••••"
                                            required
                                            minLength={6}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 pl-9 pr-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-600"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading || !password || !confirm}
                                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-4 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                                >
                                    {isLoading && (
                                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                    )}
                                    {isLoading ? 'Guardando...' : 'Guardar nueva contraseña'}
                                </button>
                            </form>
                        </>
                    )}

                    <div className="mt-6 pt-6 border-t border-slate-700/50">
                        <Link href="/login" className="flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
                            <ArrowLeft className="w-3.5 h-3.5" />
                            Volver al inicio de sesión
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function ResetPasswordPage() {
    return (
        <React.Suspense fallback={
            <div className="min-h-screen bg-grid flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <ResetPasswordContent />
        </React.Suspense>
    )
}
