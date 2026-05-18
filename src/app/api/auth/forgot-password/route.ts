import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import jwt from 'jsonwebtoken'
import nodemailer from 'nodemailer'

const JWT_SECRET = process.env.AUTH_SECRET || 'fallback-secret'
const RESET_EXPIRES_IN = '1h'

export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json()
        if (!email) return NextResponse.json({ ok: false, error: 'Email requerido' }, { status: 400 })

        // Find user — always return success to avoid email enumeration
        const user = await prisma.user.findUnique({ where: { email } })
        if (!user) return NextResponse.json({ ok: true })

        // Generate signed JWT reset token (no DB storage needed)
        const token = jwt.sign(
            { sub: user.id, email: user.email, purpose: 'password-reset' },
            JWT_SECRET,
            { expiresIn: RESET_EXPIRES_IN }
        )

        // Build reset link
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
        const resetLink = `${baseUrl}/reset-password?token=${token}`

        // Get SMTP config from tenant or env
        let smtpConfig: { host: string; port: number; user: string; pass: string; from: string } | null = null

        if (user.tenantId) {
            const tenant = await prisma.tenant.findUnique({ where: { id: user.tenantId } })
            if (tenant?.smtpHost && tenant?.smtpUser && tenant?.smtpPassword) {
                smtpConfig = {
                    host: tenant.smtpHost,
                    port: tenant.smtpPort || 587,
                    user: tenant.smtpUser,
                    pass: tenant.smtpPassword,
                    from: tenant.smtpFrom || tenant.smtpUser,
                }
            }
        }

        // Fallback: find any tenant with SMTP
        if (!smtpConfig) {
            const anyTenant = await prisma.tenant.findFirst({
                where: { smtpHost: { not: null }, smtpUser: { not: null }, smtpPassword: { not: null } }
            })
            if (anyTenant?.smtpHost && anyTenant?.smtpUser && anyTenant?.smtpPassword) {
                smtpConfig = {
                    host: anyTenant.smtpHost,
                    port: anyTenant.smtpPort || 587,
                    user: anyTenant.smtpUser,
                    pass: anyTenant.smtpPassword,
                    from: anyTenant.smtpFrom || anyTenant.smtpUser,
                }
            }
        }

        if (!smtpConfig) {
            console.warn('No SMTP configured for password reset')
            return NextResponse.json({ ok: true }) // Still return success silently
        }

        const transporter = nodemailer.createTransport({
            host: smtpConfig.host,
            port: smtpConfig.port,
            secure: smtpConfig.port === 465,
            auth: { user: smtpConfig.user, pass: smtpConfig.pass },
        })

        await transporter.sendMail({
            from: `"Sistema Comercial" <${smtpConfig.from}>`,
            to: email,
            subject: 'Restablecer tu contraseña',
            html: `
                <div style="font-family: 'Inter', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #0f172a; color: #e2e8f0; border-radius: 12px; overflow: hidden;">
                    <div style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); padding: 32px 40px; text-align: center;">
                        <h1 style="margin: 0; font-size: 20px; font-weight: 700; color: #fff;">Sistema Comercial</h1>
                    </div>
                    <div style="padding: 40px;">
                        <h2 style="font-size: 18px; font-weight: 600; color: #f1f5f9; margin: 0 0 12px;">Restablecer contraseña</h2>
                        <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 28px;">
                            Hola <strong style="color: #e2e8f0;">${user.name}</strong>, recibimos una solicitud para restablecer la contraseña de tu cuenta.
                            El enlace expira en <strong style="color: #e2e8f0;">1 hora</strong>.
                        </p>
                        <a href="${resetLink}"
                           style="display: inline-block; background: #3b82f6; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 600; letter-spacing: 0.025em;">
                            Restablecer contraseña →
                        </a>
                        <p style="color: #475569; font-size: 12px; margin: 28px 0 0; line-height: 1.5;">
                            Si no solicitaste este cambio, ignora este correo. Tu contraseña no será modificada.
                        </p>
                    </div>
                </div>
            `,
        })

        return NextResponse.json({ ok: true })
    } catch (error) {
        console.error('Forgot password error:', error)
        return NextResponse.json({ ok: true }) // Never reveal internal errors
    }
}
