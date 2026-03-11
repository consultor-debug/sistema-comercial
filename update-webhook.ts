import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  await prisma.tenant.updateMany({
    data: { n8nWebhookUrl: "https://script.google.com/macros/s/AKfycbzDWZZrfQ-biu-Sowsz6SxB0eHivTZJ8vzJZ7wWRPp9p_p8KuOo0W5RTF3Xn2__pvfR/exec" }
  })
  await prisma.project.updateMany({
    data: { 
        n8nWebhookUrl: "https://script.google.com/macros/s/AKfycbzDWZZrfQ-biu-Sowsz6SxB0eHivTZJ8vzJZ7wWRPp9p_p8KuOo0W5RTF3Xn2__pvfR/exec",
        sheetsId: "1bxtoP3mjCIHJMQa_x5qRD1sTP-0_JDKyftwA3h-WfKM"
    }
  })
  console.log('Webhook URLs updated successfully!')
}
main()
