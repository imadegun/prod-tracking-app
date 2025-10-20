import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting database seeding...')

  // Create default company
  const company = await prisma.company.upsert({
    where: { code: 'DEFAULT' },
    update: {},
    create: {
      name: 'Default Ceramic Company',
      code: 'DEFAULT',
      address: '123 Ceramic Street, Craft City',
      phone: '+1-555-0123',
      email: 'info@ceramiccompany.com',
      settings: JSON.stringify({
        workingDays: ['tuesday', 'wednesday', 'thursday', 'friday', 'monday'],
        overtimeDays: ['saturday', 'sunday'],
        rejectLimit: 10
      })
    }
  })

  console.log('Created company:', company.name)

  // Create default production stages
  const stages = [
    { name: 'Throwing', code: 'throwing', backgroundColor: '#FF6B6B', displayOrder: 1, description: 'Initial shaping of ceramic pieces' },
    { name: 'Trimming', code: 'trimming', backgroundColor: '#4ECDC4', displayOrder: 2, description: 'Refining and trimming excess clay' },
    { name: 'Decoration', code: 'decoration', backgroundColor: '#45B7D1', displayOrder: 3, description: 'Applying decorative elements' },
    { name: 'Drying', code: 'drying', backgroundColor: '#96CEB4', displayOrder: 4, description: 'Air drying before firing' },
    { name: 'Bisquit Loading', code: 'bisquit_loading', backgroundColor: '#FFEAA7', displayOrder: 5, description: 'Loading into bisquit kiln' },
    { name: 'Bisquit Firing', code: 'bisquit_firing', backgroundColor: '#DDA0DD', displayOrder: 6, description: 'First firing process' },
    { name: 'Bisquit Exit', code: 'bisquit_exit', backgroundColor: '#98D8C8', displayOrder: 7, description: 'Unloading from bisquit kiln' },
    { name: 'Sanding/Waxing', code: 'sanding_waxing', backgroundColor: '#F7DC6F', displayOrder: 8, description: 'Surface preparation' },
    { name: 'Glazing', code: 'glazing', backgroundColor: '#BB8FCE', displayOrder: 9, description: 'Applying glaze coating' },
    { name: 'High-Fire', code: 'high_fire', backgroundColor: '#85C1E9', displayOrder: 10, description: 'Final firing at high temperature' },
    { name: 'Quality Control', code: 'quality_control', backgroundColor: '#F8C471', displayOrder: 11, description: 'Final inspection and testing' }
  ]

  for (const stage of stages) {
    await prisma.productionStage.upsert({
      where: { code: stage.code },
      update: {},
      create: {
        companyId: company.id,
        ...stage
      }
    })
  }

  console.log('Created production stages')

  // Create default users with different roles
  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      companyId: company.id,
      username: 'admin',
      email: 'admin@ceramiccompany.com',
      passwordHash: hashedPassword,
      role: 'admin',
      fullName: 'System Administrator'
    }
  })

  const inputUser = await prisma.user.upsert({
    where: { username: 'inputuser' },
    update: {},
    create: {
      companyId: company.id,
      username: 'inputuser',
      email: 'input@ceramiccompany.com',
      passwordHash: hashedPassword,
      role: 'inputdata',
      fullName: 'Data Entry Operator'
    }
  })

  const superAdminUser = await prisma.user.upsert({
    where: { username: 'superadmin' },
    update: {},
    create: {
      companyId: company.id,
      username: 'superadmin',
      email: 'superadmin@ceramiccompany.com',
      passwordHash: hashedPassword,
      role: 'superadmin',
      fullName: 'Super Administrator'
    }
  })

  console.log('Created users: admin, inputuser, superadmin')

  // Create sample operators
  const operators = [
    { employeeId: 'EMP001', fullName: 'John Smith', skills: JSON.stringify(['throwing', 'trimming']) },
    { employeeId: 'EMP002', fullName: 'Sarah Johnson', skills: JSON.stringify(['decoration', 'glazing']) },
    { employeeId: 'EMP003', fullName: 'Mike Wilson', skills: JSON.stringify(['quality_control', 'sanding_waxing']) },
    { employeeId: 'EMP004', fullName: 'Emily Davis', skills: JSON.stringify(['throwing', 'bisquit_loading']) },
    { employeeId: 'EMP005', fullName: 'Robert Brown', skills: JSON.stringify(['high_fire', 'bisquit_exit']) }
  ]

  for (const operator of operators) {
    await prisma.operator.upsert({
      where: { employeeId: operator.employeeId },
      update: {},
      create: {
        companyId: company.id,
        ...operator,
        hireDate: new Date('2023-01-15')
      }
    })
  }

  console.log('Created sample operators')

  // Create sample clients
  const clients = [
    { name: 'Art Gallery Downtown', department: 'Acquisitions', contactPerson: 'Jane Cooper', phone: '555-0101', email: 'jane@artgallery.com' },
    { name: 'Home Decor Store', department: 'Purchasing', contactPerson: 'Tom Miller', phone: '555-0102', email: 'tom@homedecor.com' },
    { name: 'Restaurant Chain', department: 'Procurement', contactPerson: 'Lisa Anderson', phone: '555-0103', email: 'lisa@restaurant.com' }
  ]

  for (const client of clients) {
    await prisma.client.upsert({
      where: { id: 0 }, // Will create new since id 0 doesn't exist
      update: {},
      create: {
        companyId: company.id,
        ...client
      }
    })
  }

  console.log('Created sample clients')

  // Create sample products
  const products = [
    { code: 'CER001', name: 'Classic Vase', color: 'Blue', texture: 'Smooth', material: 'Porcelain', standardTime: 2.5, difficultyLevel: 3 },
    { code: 'CER002', name: 'Decorative Bowl', color: 'Green', texture: 'Rough', material: 'Stoneware', standardTime: 1.8, difficultyLevel: 2 },
    { code: 'CER003', name: 'Coffee Mug Set', color: 'Brown', texture: 'Matte', material: 'Ceramic', standardTime: 1.2, difficultyLevel: 1 },
    { code: 'CER004', name: 'Artistic Plate', color: 'Red', texture: 'Glossy', material: 'Porcelain', standardTime: 2.0, difficultyLevel: 4 },
    { code: 'CER005', name: 'Teapot', color: 'White', texture: 'Textured', material: 'Stoneware', standardTime: 3.5, difficultyLevel: 5 }
  ]

  for (const product of products) {
    await prisma.product.upsert({
      where: { code: product.code },
      update: {},
      create: {
        companyId: company.id,
        ...product
      }
    })
  }

  console.log('Created sample products')

  // Create sample production orders
  const galleryClient = await prisma.client.findFirst({ where: { name: 'Art Gallery Downtown' } })
  const vaseProduct = await prisma.product.findFirst({ where: { code: 'CER001' } })
  const bowlProduct = await prisma.product.findFirst({ where: { code: 'CER002' } })

  if (galleryClient && vaseProduct && bowlProduct) {
    const productionOrder = await prisma.productionOrder.upsert({
      where: { poNo: 'PO-2024-001' },
      update: {},
      create: {
        companyId: company.id,
        clientId: galleryClient.id,
        poNo: 'PO-2024-001',
        deliveryDate: new Date('2024-12-15'),
        priority: 2,
        status: 'pending',
        notes: 'Urgent order for gallery exhibition'
      }
    })

    // Create production order items
    await prisma.productionOrderItem.deleteMany({
      where: { productionOrderId: productionOrder.id }
    })

    await prisma.productionOrderItem.create({
      data: {
        productionOrderId: productionOrder.id,
        productId: vaseProduct.id,
        qtyOrdered: 50,
        notes: 'Classic design with blue glaze'
      }
    })

    await prisma.productionOrderItem.create({
      data: {
        productionOrderId: productionOrder.id,
        productId: bowlProduct.id,
        qtyOrdered: 30,
        notes: 'Decorative bowls for display'
      }
    })

    console.log('Created sample production orders')
  }

  // Create monthly targets for current month
  const currentMonth = new Date()
  currentMonth.setDate(1) // First day of current month
  currentMonth.setHours(0, 0, 0, 0) // Set to start of day

  for (const product of products) {
    const productRecord = await prisma.product.findFirst({ where: { code: product.code } })
    if (productRecord) {
      await prisma.monthlyTarget.upsert({
        where: {
          companyId_productId_targetMonth: {
            companyId: company.id,
            productId: productRecord.id,
            targetMonth: currentMonth
          }
        },
        update: {},
        create: {
          companyId: company.id,
          productId: productRecord.id,
          targetMonth: currentMonth,
          targetQuantity: 100,
          createdBy: adminUser.id
        }
      })
    }
  }

  console.log('Created monthly targets')
  console.log('Database seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })