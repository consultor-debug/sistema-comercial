import 'dotenv/config'
import { PrismaClient, LotStatus, UserRole } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Seeding database...')

    // Create Super Admin
    const superAdminPassword = await hash('admin123', 12)
    const superAdmin = await prisma.user.upsert({
        where: { email: 'admin@sistemacomercial.com' },
        update: {},
        create: {
            email: 'admin@sistemacomercial.com',
            passwordHash: superAdminPassword,
            name: 'Super Admin',
            role: UserRole.SUPER_ADMIN,
            canChangeStatus: true
        }
    })
    console.log('✓ Super Admin created:', superAdmin.email)

    // Create Demo Tenant
    const tenant = await prisma.tenant.upsert({
        where: { slug: 'inmobiliaria-demo' },
        update: {},
        create: {
            name: 'Inmobiliaria Demo',
            slug: 'inmobiliaria-demo',
            primaryColor: '#3B82F6',
            isActive: true,
            smtpHost: 'smtp.gmail.com',
            smtpPort: 587
        }
    })
    console.log('✓ Tenant created:', tenant.name)

    // Create Tenant Admin
    const adminPassword = await hash('asesor123', 12)
    const tenantAdmin = await prisma.user.upsert({
        where: { email: 'admin@inmobiliaria-demo.com' },
        update: {},
        create: {
            email: 'admin@inmobiliaria-demo.com',
            passwordHash: adminPassword,
            name: 'Admin Demo',
            role: UserRole.ADMIN,
            canChangeStatus: true,
            tenantId: tenant.id
        }
    })
    console.log('✓ Tenant Admin created:', tenantAdmin.email)

    // Create Asesor
    const asesor = await prisma.user.upsert({
        where: { email: 'asesor@inmobiliaria-demo.com' },
        update: {},
        create: {
            email: 'asesor@inmobiliaria-demo.com',
            passwordHash: adminPassword,
            name: 'Juan Pérez',
            role: UserRole.ASESOR,
            canChangeStatus: true,
            tenantId: tenant.id
        }
    })
    console.log('✓ Asesor created:', asesor.email)

    // Create Project
    const project = await prisma.project.upsert({
        where: { id: 'proj-demo-1' },
        update: {},
        create: {
            id: 'proj-demo-1',
            tenantId: tenant.id,
            name: 'Residencial Los Jardines',
            description: 'Proyecto residencial premium - 1era y 2da Etapa',
            maxCuotas: 60,
            minInicial: 5000,
            interestRate: 0,
            isActive: true
        }
    })
    console.log('✓ Project created:', project.name)

    // Create Lots
    const manzanas = ['A', 'B', 'C', 'D']
    const tipologias = ['Residencial', 'Comercial', 'Mixto']
    const estados: LotStatus[] = ['LIBRE', 'LIBRE', 'LIBRE', 'SEPARADO', 'VENDIDO', 'NO_DISPONIBLE']

    let lotCount = 0
    for (const manzana of manzanas) {
        const lotsInManzana = manzana === 'A' ? 12 : manzana === 'B' ? 10 : 8

        for (let lote = 1; lote <= lotsInManzana; lote++) {
            const code = `${manzana}-${lote.toString().padStart(2, '0')}`
            const estado = estados[Math.floor(Math.random() * estados.length)]

            // Calculate map position
            const baseX = manzana === 'A' ? 100 : manzana === 'B' ? 350 : manzana === 'C' ? 100 : 350
            const baseY = manzana === 'A' || manzana === 'B' ? 80 : 320
            const col = (lote - 1) % 4
            const row = Math.floor((lote - 1) / 4)

            await prisma.lot.upsert({
                where: {
                    projectId_code: {
                        projectId: project.id,
                        code
                    }
                },
                update: {},
                create: {
                    projectId: project.id,
                    code,
                    manzana,
                    loteNumero: lote,
                    areaM2: 120 + Math.floor(Math.random() * 80),
                    tipologia: tipologias[Math.floor(Math.random() * tipologias.length)],
                    etapa: manzana <= 'B' ? '1era Etapa' : '2da Etapa',
                    frenteM: 8 + Math.random() * 4,
                    fondoM: 15 + Math.random() * 5,
                    ladoDerM: 15 + Math.random() * 5,
                    ladoIzqM: 15 + Math.random() * 5,
                    precioLista: 50000 + Math.floor(Math.random() * 30000),
                    descuentoMax: 5000 + Math.floor(Math.random() * 3000),
                    estado,
                    asesorId: estado !== 'LIBRE' ? asesor.id : null,
                    mapShapeType: 'circle',
                    mapShapeData: {
                        x: baseX + col * 60,
                        y: baseY + row * 60,
                        radius: 22
                    }
                }
            })
            lotCount++
        }
    }
    console.log(`✓ ${lotCount} lots created`)

    // Create subscription for tenant
    await prisma.subscription.upsert({
        where: { tenantId: tenant.id },
        update: {},
        create: {
            tenantId: tenant.id,
            plan: 'PRO',
            status: 'ACTIVE',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        }
    })
    console.log('✓ Subscription created')

    console.log('\n✅ Database seeded successfully!')
    console.log('\n📝 Demo credentials:')
    console.log('   Super Admin: admin@sistemacomercial.com / admin123')
    console.log('   Tenant Admin: admin@inmobiliaria-demo.com / asesor123')
    console.log('   Asesor: asesor@inmobiliaria-demo.com / asesor123')
}

main()
    .catch((e) => {
        console.error('❌ Seed error:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
