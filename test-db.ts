import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const p = await prisma.project.findFirst({ include: { tenant: true } })
  console.log(p)
}
main()
