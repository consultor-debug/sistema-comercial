import { prisma } from './src/lib/db'

async function checkProjects() {
    const projects = await prisma.project.findMany()
    console.log(JSON.stringify(projects, null, 2))
}

checkProjects()
