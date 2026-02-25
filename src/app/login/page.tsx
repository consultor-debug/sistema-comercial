'use client'

import * as React from 'react'
import Link from 'next/link'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { authenticate } from '@/lib/actions'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Building2, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react'

export default function LoginPage() {
    const [errorMessage, dispatch] = useActionState(authenticate, undefined)

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
                    <p className="text-slate-400">Ingresa a tu cuenta</p>
                </div>

                {/* Login Form */}
                <Card variant="glass">
                    <CardHeader>
                        <CardTitle className="text-center">Iniciar Sesión</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form action={dispatch} className="space-y-4">
                            {errorMessage && (
                                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center gap-2 text-sm text-rose-400">
                                    <AlertCircle className="w-4 h-4" />
                                    <p>{errorMessage}</p>
                                </div>
                            )}

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
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <label className="flex items-center gap-2 text-slate-400">
                                    <input type="checkbox" className="rounded border-slate-600 bg-slate-800" />
                                    Recordarme
                                </label>
                                <Link href="/forgot-password" className="text-blue-400 hover:underline">
                                    ¿Olvidaste tu contraseña?
                                </Link>
                            </div>

                            <LoginButton />
                        </form>

                        <div className="mt-6 pt-6 border-t border-slate-700 text-center">
                            <p className="text-sm text-slate-400">
                                ¿No tienes cuenta?{' '}
                                <Link href="/register" className="text-blue-400 hover:underline font-medium">
                                    Regístrate aquí
                                </Link>
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Demo access */}
                <div className="mt-6 text-center">
                    <p className="text-sm text-slate-500 mb-3">O accede a la demostración</p>
                    <Link href="/demo">
                        <Button variant="outline" className="w-full">
                            Ver Demo sin registro
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    )
}

function LoginButton() {
    const { pending } = useFormStatus()

    return (
        <Button
            type="submit"
            className="w-full"
            size="lg"
            isLoading={pending}
        >
            Ingresar
            <ArrowRight className="w-4 h-4" />
        </Button>
    )
}
