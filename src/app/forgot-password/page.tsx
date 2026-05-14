'use client'

import * as React from 'react'
import Link from 'next/link'
import { Building2, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'

export default function ForgotPasswordPage() {
    const [email, setEmail] = React.useState('')
    const [submitted, setSubmitted] = React.useState(false)
    const [isLoading, setIsLoading] = React.useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email) return
        setIsLoading(true)
        // Simulate a short delay (no real reset flow yet)
        await new Promise((r) => setTimeout(r, 800))
        setIsLoading(false)
        setSubmitted(true)
    }

    return (
        <div className="min-h-screen bg-grid flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-3">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                            <Building2 className="w-8 h-8 text-white" />
                        </div>
                    </Link>
                    <h1 className="mt-4 text-2xl font-bold text-white">Sistema Comercial</h1>
                    <p className="text-slate-400">Recupera tu acceso</p>
                </div>

                {/* Card */}
                <div className="bg-slate-900/60 backdrop-blur-sm border border-white/8 rounded-2xl p-8">
                    {!submitted ? (
                        <>
                            <h2 className="text-lg font-semibold text-white mb-1">¿Olvidaste tu contraseña?</h2>
                            <p className="text-sm text-slate-400 mb-6">
                                Ingresa tu correo y te enviaremos instrucciones para restablecer tu contraseña.
                            </p>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                                        Correo Electrónico
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="tu@email.com"
                                            required
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 pl-9 pr-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-600 transition-all"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading || !email}
                                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                                >
                                    {isLoading ? (
                                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                    ) : null}
                                    {isLoading ? 'Enviando...' : 'Enviar instrucciones'}
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="text-center py-4">
                            <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                            </div>
                            <h2 className="text-lg font-semibold text-white mb-2">Revisa tu correo</h2>
                            <p className="text-sm text-slate-400 mb-1">
                                Si existe una cuenta con <span className="text-slate-300">{email}</span>,
                            </p>
                            <p className="text-sm text-slate-400">
                                recibirás un enlace para restablecer tu contraseña.
                            </p>
                        </div>
                    )}

                    <div className="mt-6 pt-6 border-t border-slate-700/50">
                        <Link
                            href="/login"
                            className="flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            Volver al inicio de sesión
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
