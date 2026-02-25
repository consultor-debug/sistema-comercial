'use server'

import { signIn, signOut } from '@/auth';
import { AuthError } from 'next-auth';
import { z } from 'zod';
import { prisma } from './db';
import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';

export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
) {
    try {
        await signIn('credentials', formData);
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return 'Invalid credentials.';
                default:
                    return 'Something went wrong.';
            }
        }
        throw error;
    }
}

export async function logout() {
    await signOut();
}

export async function register(
    prevState: any,
    formData: FormData
) {
    const schema = z.object({
        name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
        email: z.string().email('Email inválido'),
        password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
        confirmPassword: z.string()
    }).refine((data) => data.password === data.confirmPassword, {
        message: "Las contraseñas no coinciden",
        path: ["confirmPassword"],
    });

    const validatedFields = schema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
        return {
            error: validatedFields.error.flatten().fieldErrors.confirmPassword?.[0] ||
                validatedFields.error.flatten().fieldErrors.password?.[0] ||
                validatedFields.error.flatten().fieldErrors.email?.[0] ||
                'Datos inválidos'
        };
    }

    const { name, email, password } = validatedFields.data;
    const hashedPassword = await bcrypt.hash(password, 12);

    try {
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return { error: 'El correo electrónico ya está registrado' };
        }

        await prisma.user.create({
            data: {
                name,
                email,
                passwordHash: hashedPassword,
                role: UserRole.ADMIN, // Default to ADMIN for self-registered users
                tenantId: '00000000-0000-0000-0000-000000000001',
                isActive: true
            }
        });

        return { success: true };
    } catch (error) {
        console.error('Registration error:', error);
        return { error: 'Error al crear la cuenta. Inténtelo de nuevo.' };
    }
}
