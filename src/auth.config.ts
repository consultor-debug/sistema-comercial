import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const userRole = (auth?.user as { role?: string })?.role;
            const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
            const isOnAdmin = nextUrl.pathname.startsWith('/admin');

            if (isOnAdmin) {
                if (isLoggedIn && userRole === 'SUPER_ADMIN') return true;
                if (isLoggedIn) return Response.redirect(new URL('/dashboard', nextUrl));
                return false; // Redirect unauthenticated users to login page
            }

            if (isOnDashboard) {
                if (isLoggedIn) return true;
                return false; // Redirect unauthenticated users to login page
            }

            if (isLoggedIn && nextUrl.pathname === '/login') {
                return Response.redirect(new URL('/dashboard', nextUrl));
            }

            return true;
        },
        async jwt({ token, user }) {
            if (user) {
                token.role = (user as { role?: string }).role;
                token.id = user.id;
                token.tenantId = (user as { tenantId?: string }).tenantId;
                token.assignedTenantIds = (user as { assignedTenantIds?: string[] }).assignedTenantIds || [];
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                (session.user as { role?: string }).role = token.role as string;
                (session.user as { id?: string }).id = token.id as string;
                (session.user as { tenantId?: string }).tenantId = token.tenantId as string;
                (session.user as { assignedTenantIds?: string[] }).assignedTenantIds = token.assignedTenantIds as string[];
            }
            return session;
        },
    },
    providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;
