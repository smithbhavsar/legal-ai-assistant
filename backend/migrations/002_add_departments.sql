-- 002_add_departments.sql
-- Add sample departments

INSERT INTO departments (name, code, jurisdiction, state, contact_email) VALUES
('New York Police Department', 'NYPD', 'New York City', 'NY', 'legal@nypd.gov'),
('Los Angeles Police Department', 'LAPD', 'Los Angeles', 'CA', 'legal@lapd.gov'),
('Chicago Police Department', 'CPD', 'Chicago', 'IL', 'legal@chicagopolice.gov'),
('Houston Police Department', 'HPD', 'Houston', 'TX', 'legal@houstonpolice.gov'),
('Miami-Dade Police Department', 'MDPD', 'Miami-Dade County', 'FL', 'legal@miamidade.gov');

-- Create default admin user
INSERT INTO users (email, password_hash, first_name, last_name, role, badge_number) VALUES
('admin@legalai.gov', '$2b$10$example_hash_replace_in_production', 'System', 'Administrator', 'admin', 'ADMIN001');
