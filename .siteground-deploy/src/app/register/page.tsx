'use client'

import * as React from 'react'
import Link from 'next/link'
import { useActionState } from 'react'
import { register } from '@/lib/actions'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Building2, Mail, Lock, User, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function RegisterPage() {
    const [state, dispatch] = useActionState(register, undefined)

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
                    <p className="text-slate-400">Crea tu cuenta de administrador</p>
                </div>

                {/* Register Form */}
                <Card variant="glass">
                    <CardHeader>
                        <CardTitle className="text-center">Registro</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {state?.success ? (
                            <div className="text-center py-8 space-y-4">
                                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
                                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-2">¡Registro exitoso!</h3>
                                    <p className="text-slate-400 mb-6">Tu cuenta ha sido creada correctamente. Ahora puedes iniciar sesión.</p>
                                    <Link href="/login" className="w-full">
                                        <Button className="w-full">
                                            Ir al Login
                                            <ArrowRight className="w-4 h-4" />
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <form action={dispatch} className="space-y-4">
                                {state?.error && (
                                    <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center gap-2 text-sm text-rose-400">
                                        <AlertCircle className="w-4 h-4" />
                                        <p>{state.error}</p>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">
                                        Nombre Completo
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                                        <input
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-9 pr-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-600"
                                            type="text"
                                            name="name"
                                            placeholder="Tu nombre"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">
                                        Correo Electrónico
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                                        <input
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-9 pr-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-600"
                                            type="email"
                                            name="email"
                                            placeholder="tu@email.com"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">
                                        Contraseña
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                                        <input
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-9 pr-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-600"
                                            type="password"
                                            name="password"
                                            placeholder="••••••••"
                                            required
                                            minLength={6}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">
                                        Confirmar Contraseña
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                                        <input
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-9 pr-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-600"
                                            type="password"
                                            name="confirmPassword"
                                            placeholder="••••••••"
                                            required
                                            minLength={6}
                                        />
                                    </div>
                                </div>

                                <SubmitButton />
                            </form>
                        )}

                        {!state?.success && (
                            <div className="mt-6 pt-6 border-t border-slate-700 text-center">
                                <p className="text-sm text-slate-400">
                                    ¿Ya tienes cuenta?{' '}
                                    <Link href="/login" className="text-blue-400 hover:underline font-medium">
                                        Inicia sesión
                                    </Link>
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

import { useFormStatus } from 'react-dom'

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <Button
            type="submit"
            className="w-full mt-2"
            size="lg"
            isLoading={pending}
        >
            Registrarme
            <ArrowRight className="w-4 h-4" />
        </Button>
    )
}
