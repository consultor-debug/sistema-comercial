import { PrismaClient } from '@prisma/client'; const prisma = new PrismaClient(); prisma.user.findMany().then(users => { console.log(JSON.stringify(users, null, 2)); process.exit(0); });
