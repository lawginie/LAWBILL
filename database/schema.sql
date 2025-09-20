-- South African Legal Billing SAAS Database Schema
-- Designed for multi-tenant architecture with POPIA compliance

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Firms table (multi-tenant)
CREATE TABLE firms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    vat_number VARCHAR(20),
    registration_number VARCHAR(50),
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    settings JSONB DEFAULT '{}',
    subscription_status VARCHAR(20) DEFAULT 'trial',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table with role-based access
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    firm_id UUID REFERENCES firms(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'attorney', 'secretary', 'opponent')),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Court types and scales
CREATE TABLE court_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(10) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true
);

-- Tariff versions for different courts and time periods
CREATE TABLE tariff_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    court_type_id UUID REFERENCES court_types(id),
    scale VARCHAR(10) NOT NULL, -- A, B, C, D
    effective_from DATE NOT NULL,
    effective_to DATE,
    version_name VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tariff items (preloaded from SA court schedules)
CREATE TABLE tariff_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tariff_version_id UUID REFERENCES tariff_versions(id),
    item_number VARCHAR(20),
    label VARCHAR(255) NOT NULL,
    description TEXT,
    rate DECIMAL(10,2),
    unit VARCHAR(50), -- per hour, per page, per km, fixed
    minimum_units DECIMAL(8,2) DEFAULT 0,
    maximum_units DECIMAL(8,2),
    cap_amount DECIMAL(10,2),
    vat_applicable BOOLEAN DEFAULT true,
    category VARCHAR(50), -- fees, disbursements, counsel
    subcategory VARCHAR(50),
    is_active BOOLEAN DEFAULT true
);

-- Legal matters/cases
CREATE TABLE matters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id UUID REFERENCES firms(id) ON DELETE CASCADE,
    case_number VARCHAR(100),
    court_type_id UUID REFERENCES court_types(id),
    scale VARCHAR(10) NOT NULL,
    plaintiff VARCHAR(255),
    defendant VARCHAR(255),
    matter_description TEXT,
    status VARCHAR(20) DEFAULT 'active',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bills of costs
CREATE TABLE bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matter_id UUID REFERENCES matters(id) ON DELETE CASCADE,
    bill_number VARCHAR(50),
    status VARCHAR(20) DEFAULT 'draft', -- draft, submitted, taxed, finalized
    subtotal_fees DECIMAL(12,2) DEFAULT 0,
    subtotal_disbursements DECIMAL(12,2) DEFAULT 0,
    subtotal_counsel DECIMAL(12,2) DEFAULT 0,
    vat_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) DEFAULT 0,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Individual bill items
CREATE TABLE bill_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bill_id UUID REFERENCES bills(id) ON DELETE CASCADE,
    tariff_item_id UUID REFERENCES tariff_items(id),
    date_of_service DATE,
    description TEXT NOT NULL,
    units DECIMAL(8,2) NOT NULL DEFAULT 1,
    rate_applied DECIMAL(10,2) NOT NULL,
    amount_ex_vat DECIMAL(10,2) NOT NULL,
    vat_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    source VARCHAR(50), -- manual, ocr, import
    source_reference TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- OCR processed files
CREATE TABLE ocr_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matter_id UUID REFERENCES matters(id) ON DELETE CASCADE,
    original_filename VARCHAR(255),
    storage_key VARCHAR(500),
    file_type VARCHAR(20),
    file_size INTEGER,
    ocr_text TEXT,
    ocr_confidence DECIMAL(5,2),
    extracted_items JSONB,
    processing_status VARCHAR(20) DEFAULT 'pending',
    processed_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Objections from opposing parties
CREATE TABLE objections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bill_item_id UUID REFERENCES bill_items(id) ON DELETE CASCADE,
    objected_by UUID REFERENCES users(id),
    reason TEXT NOT NULL,
    proposed_amount DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, rejected, ruled
    resolution TEXT,
    resolved_amount DECIMAL(10,2),
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bill exports (PDF/DOCX)
CREATE TABLE exports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bill_id UUID REFERENCES bills(id) ON DELETE CASCADE,
    export_type VARCHAR(20) NOT NULL, -- pdf, docx, taxation_bundle
    template_used VARCHAR(100),
    file_path VARCHAR(500),
    file_size INTEGER,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscription plans
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10,2),
    price_annual DECIMAL(10,2),
    max_matters INTEGER,
    max_users INTEGER,
    max_storage_gb INTEGER,
    ocr_pages_included INTEGER,
    features JSONB,
    is_active BOOLEAN DEFAULT true
);

-- Firm subscriptions
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id UUID REFERENCES firms(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES subscription_plans(id),
    status VARCHAR(20) DEFAULT 'active',
    billing_cycle VARCHAR(20) DEFAULT 'monthly',
    current_period_start DATE,
    current_period_end DATE,
    trial_end DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Per-matter charges
CREATE TABLE matter_charges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matter_id UUID REFERENCES matters(id) ON DELETE CASCADE,
    firm_id UUID REFERENCES firms(id) ON DELETE CASCADE,
    charge_model VARCHAR(20) NOT NULL, -- flat, percentage
    amount DECIMAL(10,2) NOT NULL,
    percentage DECIMAL(5,2),
    status VARCHAR(20) DEFAULT 'pending',
    triggered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoices for platform fees
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id UUID REFERENCES firms(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    vat_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL,
    line_items JSONB,
    status VARCHAR(20) DEFAULT 'pending',
    due_date DATE,
    paid_at TIMESTAMP WITH TIME ZONE,
    payment_reference VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit logs for POPIA compliance
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id UUID REFERENCES firms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS) policies
ALTER TABLE firms ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE matters ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocr_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE objections ENABLE ROW LEVEL SECURITY;
ALTER TABLE exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE matter_charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX idx_users_firm_id ON users(firm_id);
CREATE INDEX idx_matters_firm_id ON matters(firm_id);
CREATE INDEX idx_bills_matter_id ON bills(matter_id);
CREATE INDEX idx_bill_items_bill_id ON bill_items(bill_id);
CREATE INDEX idx_tariff_items_version_id ON tariff_items(tariff_version_id);
CREATE INDEX idx_ocr_files_matter_id ON ocr_files(matter_id);
CREATE INDEX idx_audit_logs_firm_id ON audit_logs(firm_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Functions for automatic timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_firms_updated_at BEFORE UPDATE ON firms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_matters_updated_at BEFORE UPDATE ON matters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bills_updated_at BEFORE UPDATE ON bills FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();