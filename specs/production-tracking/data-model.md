# Data Model: Production Tracking System

## Database Schema Design

### Core Entities

```sql
-- Companies (Multi-tenant)
CREATE TABLE companies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(255),
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Users (Role-based access)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL, -- superadmin, admin, inputdata
  full_name VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Operators (Production workers)
CREATE TABLE operators (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  employee_id VARCHAR(50) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  skills TEXT[], -- Array of production skills
  hire_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Clients (Customer companies)
CREATE TABLE clients (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  department VARCHAR(255),
  contact_person VARCHAR(255),
  phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Products (Ceramic items)
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  color VARCHAR(100),
  texture VARCHAR(100),
  material VARCHAR(255),
  notes TEXT,
  standard_time DECIMAL(5,2), -- hours per unit
  difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Production Orders (POL - Purchase Orders)
CREATE TABLE production_orders (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  client_id INTEGER REFERENCES clients(id) ON DELETE RESTRICT,
  po_no VARCHAR(100) UNIQUE NOT NULL,
  delivery_date DATE NOT NULL,
  priority INTEGER DEFAULT 1, -- 1=normal, 2=high, 3=urgent
  status VARCHAR(20) DEFAULT 'pending', -- pending, in_progress, completed, cancelled
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Production Order Items (One POL can have many products)
CREATE TABLE production_order_items (
  id SERIAL PRIMARY KEY,
  production_order_id INTEGER REFERENCES production_orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE RESTRICT,
  qty_ordered INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Work Plans (Weekly calendar planning)
CREATE TABLE work_plans (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  week_start DATE NOT NULL, -- Monday of the week
  operator_id INTEGER REFERENCES operators(id) ON DELETE RESTRICT,
  production_order_id INTEGER REFERENCES production_orders(id) ON DELETE RESTRICT,
  production_order_item_id INTEGER REFERENCES production_order_items(id) ON DELETE RESTRICT,
  product_id INTEGER REFERENCES products(id) ON DELETE RESTRICT,
  production_stage_id INTEGER REFERENCES production_stages(id) ON DELETE RESTRICT,
  decoration_detail TEXT, -- For decoration stage specifics
  target_quantity INTEGER NOT NULL,
  planned_date DATE NOT NULL,
  is_overtime BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(company_id, week_start, operator_id, planned_date, production_stage_id)
);

-- Production Records (Daily work results)
CREATE TABLE production_records (
  id SERIAL PRIMARY KEY,
  work_plan_id INTEGER REFERENCES work_plans(id) ON DELETE RESTRICT,
  recorded_date DATE NOT NULL,
  recorded_by INTEGER REFERENCES users(id) ON DELETE RESTRICT,
  completed_quantity INTEGER DEFAULT 0,
  good_quantity INTEGER DEFAULT 0,
  reject_quantity INTEGER DEFAULT 0,
  reject_stage VARCHAR(50), -- Stage where rejection occurred
  reject_reason TEXT,
  start_time TIME,
  end_time TIME,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(work_plan_id, recorded_date)
);

-- Alerts (System notifications)
CREATE TABLE alerts (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  alert_type VARCHAR(50) NOT NULL, -- reject_limit_exceeded, target_missed, etc.
  severity VARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  related_record_id INTEGER, -- Can reference various records
  related_record_type VARCHAR(50), -- work_plan, production_record, etc.
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP,
  resolved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Monthly Targets
CREATE TABLE monthly_targets (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  target_month DATE NOT NULL, -- First day of month
  target_quantity INTEGER NOT NULL,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(company_id, product_id, target_month)
);
```

-- Production Stages (Master table - configurable, not fixed 11 stages)
CREATE TABLE production_stages (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL, -- throwing, trimming, etc.
  description TEXT,
  display_order INTEGER DEFAULT 0,
  background_color VARCHAR(7), -- Hex color for calendar display
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default stages (can be customized per company)
INSERT INTO production_stages (name, code, description, display_order, background_color) VALUES
('Throwing', 'throwing', 'Initial shaping of ceramic pieces', 1, '#FF6B6B'),
('Trimming', 'trimming', 'Refining and trimming excess clay', 2, '#4ECDC4'),
('Decoration', 'decoration', 'Applying decorative elements', 3, '#45B7D1'),
('Drying', 'drying', 'Air drying before firing', 4, '#96CEB4'),
('Bisquit Loading', 'bisquit_loading', 'Loading into bisquit kiln', 5, '#FFEAA7'),
('Bisquit Firing', 'bisquit_firing', 'First firing process', 6, '#DDA0DD'),
('Bisquit Exit', 'bisquit_exit', 'Unloading from bisquit kiln', 7, '#98D8C8'),
('Sanding/Waxing', 'sanding_waxing', 'Surface preparation', 8, '#F7DC6F'),
('Glazing', 'glazing', 'Applying glaze coating', 9, '#BB8FCE'),
('High-Fire', 'high_fire', 'Final firing at high temperature', 10, '#85C1E9'),
('Quality Control', 'quality_control', 'Final inspection and testing', 11, '#F8C471');

## Indexes and Constraints

```sql
-- Performance indexes
CREATE INDEX idx_work_plans_company_week ON work_plans(company_id, week_start);
CREATE INDEX idx_work_plans_operator_date ON work_plans(operator_id, planned_date);
CREATE INDEX idx_production_records_work_plan ON production_records(work_plan_id);
CREATE INDEX idx_production_records_date ON production_records(recorded_date);
CREATE INDEX idx_alerts_company_unresolved ON alerts(company_id, is_resolved) WHERE is_resolved = false;
CREATE INDEX idx_production_orders_company_status ON production_orders(company_id, status);

-- Check constraints
ALTER TABLE production_records ADD CONSTRAINT valid_quantities CHECK (completed_quantity >= 0 AND good_quantity >= 0 AND reject_quantity >= 0 AND (good_quantity + reject_quantity) = completed_quantity);
ALTER TABLE alerts ADD CONSTRAINT valid_severity CHECK (severity IN ('low', 'medium', 'high', 'critical'));
ALTER TABLE monthly_targets ADD CONSTRAINT positive_target CHECK (target_quantity > 0);
ALTER TABLE production_stages ADD CONSTRAINT valid_hex_color CHECK (background_color ~ '^#[0-9A-Fa-f]{6}$');
```

## Relationships

- **Company** (1) → (M) **Users**
- **Company** (1) → (M) **Operators**
- **Company** (1) → (M) **Clients**
- **Company** (1) → (M) **Products**
- **Company** (1) → (M) **Production Orders**
- **Company** (1) → (M) **Production Order Items**
- **Company** (1) → (M) **Production Stages**
- **Company** (1) → (M) **Work Plans**
- **Company** (1) → (M) **Alerts**
- **Company** (1) → (M) **Monthly Targets**
- **Client** (1) → (M) **Production Orders**
- **Production Order** (1) → (M) **Production Order Items**
- **Product** (1) → (M) **Production Order Items**
- **Product** (1) → (M) **Work Plans**
- **Product** (1) → (M) **Monthly Targets**
- **Production Stage** (1) → (M) **Work Plans**
- **Production Order Item** (1) → (M) **Work Plans**
- **Production Order** (1) → (M) **Work Plans**
- **Operator** (1) → (M) **Work Plans**
- **Work Plan** (1) → (M) **Production Records**
- **User** (1) → (M) **Production Records** (as recorder)
- **User** (1) → (M) **Alerts** (as resolver)

## Data Flow

1. **Setup**: Superadmin creates company → admin adds operators, clients, products
2. **Planning**: Admin creates monthly targets → generates weekly work plans → assigns operators to stages
3. **Execution**: Operators work → input users record daily production results
4. **Monitoring**: System generates alerts for rejects → calculates target achievement → produces reports

## Key Design Decisions

- **Single-tenant**: Designed for one ceramic company (can be extended to multi-tenant later)
- **Configurable Production Stages**: Master table allows customization of production stages per company
- **Background Colors**: Each stage has customizable background color for calendar visualization
- **POL with Multiple Products**: One purchase order can contain multiple products via order items
- **Comprehensive Tracking**: Separate good/reject quantities with reasons and stages
- **Dynamic Planning**: Work plans can be adjusted weekly based on various factors
- **Alert System**: Automated notifications for production issues and quality control
- **Monthly Targets**: Basis for weekly planning and reporting