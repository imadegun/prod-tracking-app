# Implementation Guide: Production Tracking System

## Overview
This guide provides step-by-step implementation instructions for the Production Tracking System based on the finalized specifications.

## Prerequisites
- Node.js LTS (18+)
- PostgreSQL 15+
- Git
- VS Code (recommended)

## Phase 1: Foundation & Authentication (Week 1-2)

### Step 1.1: Initialize Next.js Project
```bash
# Create new Next.js project
npx create-next-app@latest production-tracking --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --yes

cd production-tracking

# Install additional dependencies
npm install prisma @prisma/client bcryptjs jsonwebtoken @types/bcryptjs @types/jsonwebtoken
npm install -D @types/node ts-node nodemon
```

### Step 1.2: Set up Prisma ORM
```bash
# Initialize Prisma
npx prisma init

# Update .env with database URL
DATABASE_URL="postgresql://username:password@localhost:5432/production_tracking"
```

### Step 1.3: Create Database Schema
Create `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Company {
  id        Int      @id @default(autoincrement())
  name      String
  code      String   @unique
  address   String?
  phone     String?
  email     String?
  settings  Json     @default("{}")
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  users             User[]
  operators         Operator[]
  clients           Client[]
  products          Product[]
  productionOrders  ProductionOrder[]
  productionStages  ProductionStage[]
  workPlans         WorkPlan[]
  alerts            Alert[]
  monthlyTargets    MonthlyTarget[]

  @@map("companies")
}

model User {
  id            Int      @id @default(autoincrement())
  companyId     Int
  username      String   @unique
  email         String   @unique
  passwordHash  String
  role          String   // superadmin, admin, inputdata
  fullName      String?
  isActive      Boolean  @default(true)
  lastLogin     DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  company             Company              @relation(fields: [companyId], references: [id], onDelete: Cascade)
  recordedProduction  ProductionRecord[]   @relation("RecordedBy")
  resolvedAlerts      Alert[]              @relation("ResolvedBy")

  @@map("users")
}

model Operator {
  id          Int      @id @default(autoincrement())
  companyId   Int
  employeeId  String   @unique
  fullName    String
  skills      String[] // Array of skills
  hireDate    Date?    @db.Date
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  company   Company    @relation(fields: [companyId], references: [id], onDelete: Cascade)
  workPlans WorkPlan[]

  @@map("operators")
}

model Client {
  id         Int      @id @default(autoincrement())
  companyId  Int
  name       String
  department String?
  contactPerson String?
  phone      String?
  email      String?
  address    String?
  isActive   Boolean  @default(true)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  company          Company            @relation(fields: [companyId], references: [id], onDelete: Cascade)
  productionOrders ProductionOrder[]

  @@map("clients")
}

model Product {
  id             Int      @id @default(autoincrement())
  companyId      Int
  code           String   @unique
  name           String
  color          String?
  texture        String?
  material       String?
  notes          String?
  standardTime   Decimal? @db.Decimal(5, 2) // hours per unit
  difficultyLevel Int?    // 1-5
  isActive       Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  company             Company               @relation(fields: [companyId], references: [id], onDelete: Cascade)
  productionOrderItems ProductionOrderItem[]
  workPlans           WorkPlan[]
  monthlyTargets      MonthlyTarget[]

  @@map("products")
}

model ProductionOrder {
  id           Int      @id @default(autoincrement())
  companyId    Int
  clientId     Int
  poNo         String   @unique
  deliveryDate Date     @db.Date
  priority     Int      @default(1) // 1=normal, 2=high, 3=urgent
  status       String   @default("pending") // pending, in_progress, completed, cancelled
  notes        String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  company          Company               @relation(fields: [companyId], references: [id], onDelete: Cascade)
  client           Client                @relation(fields: [clientId], references: [id], onDelete: Restrict)
  productionOrderItems ProductionOrderItem[]
  workPlans       WorkPlan[]

  @@map("production_orders")
}

model ProductionOrderItem {
  id                 Int @id @default(autoincrement())
  productionOrderId  Int
  productId          Int
  qtyOrdered         Int
  notes              String?

  productionOrder    ProductionOrder     @relation(fields: [productionOrderId], references: [id], onDelete: Cascade)
  product            Product             @relation(fields: [productId], references: [id], onDelete: Restrict)
  workPlans          WorkPlan[]

  @@map("production_order_items")
}

model ProductionStage {
  id             Int      @id @default(autoincrement())
  companyId      Int
  name           String
  code           String   @unique
  description    String?
  displayOrder   Int      @default(0)
  backgroundColor String? // Hex color for calendar
  isActive       Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  company   Company    @relation(fields: [companyId], references: [id], onDelete: Cascade)
  workPlans WorkPlan[]

  @@map("production_stages")
}

model WorkPlan {
  id                      Int      @id @default(autoincrement())
  companyId               Int
  weekStart               Date     @db.Date // Monday of the week
  operatorId              Int
  productionOrderId       Int
  productionOrderItemId   Int
  productId               Int
  productionStageId       Int
  decorationDetail        String?  // For decoration stage specifics
  targetQuantity          Int
  plannedDate             Date     @db.Date
  isOvertime              Boolean  @default(false)
  notes                   String?
  createdAt               DateTime @default(now())
  updatedAt               DateTime @updatedAt

  company             Company             @relation(fields: [companyId], references: [id], onDelete: Cascade)
  operator            Operator            @relation(fields: [operatorId], references: [id], onDelete: Restrict)
  productionOrder      ProductionOrder    @relation(fields: [productionOrderId], references: [id], onDelete: Restrict)
  productionOrderItem  ProductionOrderItem @relation(fields: [productionOrderItemId], references: [id], onDelete: Restrict)
  product              Product             @relation(fields: [productId], references: [id], onDelete: Restrict)
  productionStage      ProductionStage    @relation(fields: [productionStageId], references: [id], onDelete: Restrict)
  productionRecords    ProductionRecord[]

  @@unique([companyId, weekStart, operatorId, plannedDate, productionStageId])
  @@map("work_plans")
}

model ProductionRecord {
  id                Int      @id @default(autoincrement())
  workPlanId        Int
  recordedDate      Date     @db.Date
  recordedBy        Int
  completedQuantity Int      @default(0)
  goodQuantity      Int      @default(0)
  rejectQuantity    Int      @default(0)
  rejectStage       String?
  rejectReason      String?
  startTime         DateTime? @db.Time
  endTime           DateTime? @db.Time
  notes             String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  workPlan  WorkPlan @relation(fields: [workPlanId], references: [id], onDelete: Restrict)
  recorder  User     @relation("RecordedBy", fields: [recordedBy], references: [id], onDelete: Restrict)

  @@unique([workPlanId, recordedDate])
  @@map("production_records")
}

model Alert {
  id             Int      @id @default(autoincrement())
  companyId      Int
  alertType      String   // reject_limit_exceeded, target_missed, etc.
  severity       String   @default("medium") // low, medium, high, critical
  title          String
  message        String
  relatedRecordId Int?    // Can reference various records
  relatedRecordType String? // work_plan, production_record, etc.
  isResolved     Boolean  @default(false)
  resolvedAt     DateTime?
  resolvedBy     Int?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  company   Company @relation(fields: [companyId], references: [id], onDelete: Cascade)
  resolver   User?   @relation("ResolvedBy", fields: [resolvedBy], references: [id], onDelete: SetNull)

  @@map("alerts")
}

model MonthlyTarget {
  id            Int      @id @default(autoincrement())
  companyId     Int
  productId     Int
  targetMonth   Date     @db.Date // First day of month
  targetQuantity Int
  createdBy     Int?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  company Company @relation(fields: [companyId], references: [id], onDelete: Cascade)
  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  creator User?   @relation(fields: [createdBy], references: [id], onDelete: SetNull)

  @@unique([companyId, productId, targetMonth])
  @@map("monthly_targets")
}
```

### Step 1.4: Run Database Migration
```bash
# Generate Prisma client and run migration
npx prisma generate
npx prisma db push

# Seed initial data
npx prisma db seed
```

Create `prisma/seed.ts`:
```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create default company
  const company = await prisma.company.upsert({
    where: { code: 'DEFAULT' },
    update: {},
    create: {
      name: 'Default Ceramic Company',
      code: 'DEFAULT',
      settings: {}
    }
  })

  // Create default production stages
  const stages = [
    { name: 'Throwing', code: 'throwing', backgroundColor: '#FF6B6B', displayOrder: 1 },
    { name: 'Trimming', code: 'trimming', backgroundColor: '#4ECDC4', displayOrder: 2 },
    { name: 'Decoration', code: 'decoration', backgroundColor: '#45B7D1', displayOrder: 3 },
    { name: 'Drying', code: 'drying', backgroundColor: '#96CEB4', displayOrder: 4 },
    { name: 'Bisquit Loading', code: 'bisquit_loading', backgroundColor: '#FFEAA7', displayOrder: 5 },
    { name: 'Bisquit Firing', code: 'bisquit_firing', backgroundColor: '#DDA0DD', displayOrder: 6 },
    { name: 'Bisquit Exit', code: 'bisquit_exit', backgroundColor: '#98D8C8', displayOrder: 7 },
    { name: 'Sanding/Waxing', code: 'sanding_waxing', backgroundColor: '#F7DC6F', displayOrder: 8 },
    { name: 'Glazing', code: 'glazing', backgroundColor: '#BB8FCE', displayOrder: 9 },
    { name: 'High-Fire', code: 'high_fire', backgroundColor: '#85C1E9', displayOrder: 10 },
    { name: 'Quality Control', code: 'quality_control', backgroundColor: '#F8C471', displayOrder: 11 }
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

  // Create default admin user
  const hashedPassword = await bcrypt.hash('admin123', 10)
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      companyId: company.id,
      username: 'admin',
      email: 'admin@company.com',
      passwordHash: hashedPassword,
      role: 'admin',
      fullName: 'System Administrator'
    }
  })

  console.log('Database seeded successfully')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

### Step 1.5: Set up Authentication
Create authentication utilities and middleware.

## Phase 2: Master Data Management (Week 3-4)

### Step 2.1: Create Master Data Components
Build CRUD interfaces for operators, clients, products, and production orders.

### Step 2.2: Implement Business Logic
Add validation rules and data relationships.

## Phase 3: Work Planning System (Week 5-7)

### Step 3.1: Build Calendar Component
Create interactive calendar with drag-and-drop functionality.

### Step 3.2: Implement Planning Logic
Add algorithms for work distribution and target calculation.

## Phase 4: Production Tracking (Week 8-9)

### Step 4.1: Create Data Entry Interface
Build forms for recording daily production results.

### Step 4.2: Implement Quality Control
Add reject tracking and alert generation.

## Phase 5: Reporting & Analytics (Week 10-11)

### Step 5.1: Build Report Components
Create dashboards and export functionality.

### Step 5.2: Implement Analytics
Add charts and performance metrics.

## Phase 6: Polish & Production (Week 12-13)

### Step 6.1: Testing & Optimization
Add comprehensive testing and performance optimization.

### Step 6.2: Deployment
Set up production environment and monitoring.

## Development Workflow

### Daily Development Cycle
1. Pull latest changes
2. Run tests: `npm test`
3. Start development server: `npm run dev`
4. Make changes following TDD principles
5. Commit with descriptive messages
6. Push and create PR

### Code Quality Standards
- Follow TypeScript strict mode
- Use ESLint and Prettier
- Write unit tests for business logic
- Follow component composition patterns
- Use meaningful variable names

### Database Management
- Use Prisma migrations for schema changes
- Test migrations on development data
- Backup production data before migrations
- Use transactions for data integrity

## Troubleshooting

### Common Issues
- **Prisma client not generated**: Run `npx prisma generate`
- **Database connection failed**: Check DATABASE_URL in .env
- **Migration errors**: Reset database with `npx prisma migrate reset`
- **Type errors**: Run `npm run type-check`

### Performance Optimization
- Use React.memo for expensive components
- Implement pagination for large datasets
- Add database indexes for slow queries
- Use Redis for session caching

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Database backup created
- [ ] SSL certificates installed
- [ ] Monitoring tools set up
- [ ] CDN configured for assets
- [ ] Backup strategy implemented
- [ ] Rollback plan prepared