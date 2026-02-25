import { DefaultSession } from "next-auth"
import { UserRole } from "@prisma/client"

declare module "next-auth" {
    interface Session {
        user: {
            role: UserRole
            id: string
            tenantId: string | null
        } & DefaultSession["user"]
    }

    interface User {
        role: UserRole
        tenantId: string | null
    }
}
