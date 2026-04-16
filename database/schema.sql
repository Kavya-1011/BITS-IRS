-- 1. Custom Types (Enums)
CREATE TYPE status_enum AS ENUM (
    'available', 'reserved', 'in_use', 'maintenance', 'decommissioned'
);
CREATE TYPE approval_enum AS ENUM (
    'pending', 'approved_by_secretary', 'approved_by_faculty', 'rejected'
);
CREATE TYPE payment_enum AS ENUM (
    'not_applicable', 'pending', 'deducted_from_budget', 'personal_fine_paid', 'late_fee_pending', 'late_fee_paid'
);

-- 2. Independent Tables
CREATE TABLE roles (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL
);
CREATE TABLE departments (
    dept_id SERIAL PRIMARY KEY,
    dept_name VARCHAR(100) UNIQUE NOT NULL,
    office_location VARCHAR(100)
);
CREATE TABLE clubs (
    club_id SERIAL PRIMARY KEY,
    club_name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50),
    allocated_budget DECIMAL(15,2) DEFAULT 0.00,
    current_balance DECIMAL(15,2) DEFAULT 0.00,
    total_spent DECIMAL(15,2) DEFAULT 0.00,
    CHECK (current_balance >= 0)
);
CREATE TABLE resource_categories (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(100) UNIQUE NOT NULL,
    buffer_time_minutes INT DEFAULT 0
);

-- 3. Dependent Tables
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    bits_id VARCHAR(20) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT REFERENCES roles(role_id) ON DELETE RESTRICT,
    department_id INT REFERENCES departments(dept_id) ON DELETE RESTRICT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE user_clubs (
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    club_id INT REFERENCES clubs(club_id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, club_id)
);
CREATE TABLE resources (
    resource_id SERIAL PRIMARY KEY,
    resource_name VARCHAR(100) NOT NULL,
    category_id INT REFERENCES resource_categories(category_id) ON DELETE RESTRICT,
    status status_enum DEFAULT 'available',
    is_fixed_asset BOOLEAN DEFAULT FALSE,
    hourly_rate DECIMAL(10,2) DEFAULT 0.00,
    fine_per_hour DECIMAL(10,2) DEFAULT 0.00,
    maintenance_eta TIMESTAMP NULL -- Added to fix the seed error
);

-- 4. Transactional Table
CREATE TABLE bookings (
    booking_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    resource_id INT REFERENCES resources(resource_id) ON DELETE RESTRICT,
    club_id INT REFERENCES clubs(club_id) ON DELETE SET NULL,
    request_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    actual_return_time TIMESTAMP NULL,
    purpose TEXT,
    approval_status approval_enum DEFAULT 'pending',
    payment_status payment_enum DEFAULT 'pending',
    total_cost DECIMAL(10,2) DEFAULT 0.00,
    CHECK (end_time > start_time)
);

-- 5. Audit & Logs
CREATE TABLE maintenance_logs (
    log_id SERIAL PRIMARY KEY,
    resource_id INT REFERENCES resources(resource_id) ON DELETE CASCADE,
    technician_name VARCHAR(100),
    issue_description TEXT NOT NULL,
    repair_cost DECIMAL(10,2) DEFAULT 0.00,
    completion_date TIMESTAMP NULL
);
CREATE TABLE notifications (
    notif_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Functions and Triggers
CREATE OR REPLACE FUNCTION check_booking_overlap()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM bookings
        WHERE resource_id = NEW.resource_id
        AND approval_status IN ('approved_by_secretary', 'approved_by_faculty')
        AND (NEW.start_time, NEW.end_time) OVERLAPS (start_time, end_time)
    ) THEN
        RAISE EXCEPTION 'Time slot conflict: Resource is already booked.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER prevent_double_booking
BEFORE INSERT ON bookings
FOR EACH ROW EXECUTE FUNCTION check_booking_overlap();

CREATE OR REPLACE FUNCTION calculate_cost_and_check_funds()
RETURNS TRIGGER AS $$
DECLARE
    r_rate DECIMAL(10,2);
    c_balance DECIMAL(15,2);
    hours_booked DECIMAL(10,2);
    calc_cost DECIMAL(10,2);
BEGIN
    SELECT hourly_rate INTO r_rate FROM resources WHERE resource_id = NEW.resource_id;
    hours_booked := EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) / 3600.0;
    calc_cost := r_rate * hours_booked;
    NEW.total_cost := calc_cost;

    IF NEW.club_id IS NOT NULL THEN
        SELECT current_balance INTO c_balance FROM clubs WHERE club_id = NEW.club_id;
        IF calc_cost > c_balance THEN
            RAISE EXCEPTION 'Insufficient funds. Booking cost exceeds current club balance.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER calculate_cost_trigger
BEFORE INSERT OR UPDATE OF start_time, end_time, resource_id ON bookings
FOR EACH ROW EXECUTE FUNCTION calculate_cost_and_check_funds();

CREATE OR REPLACE FUNCTION process_payment_on_approval()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.approval_status = 'approved_by_faculty' AND OLD.approval_status != 'approved_by_faculty' THEN
        IF NEW.club_id IS NOT NULL THEN
            UPDATE clubs
            SET current_balance = current_balance - NEW.total_cost,
                total_spent = total_spent + NEW.total_cost
            WHERE club_id = NEW.club_id;
            NEW.payment_status := 'deducted_from_budget';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trigger_process_payment
BEFORE UPDATE ON bookings
FOR EACH ROW EXECUTE FUNCTION process_payment_on_approval();

CREATE OR REPLACE FUNCTION settle_late_fee(p_booking_id INT)
RETURNS VOID AS $$
DECLARE
    v_fine DECIMAL(10,2);
    v_club_id INT;
BEGIN
    SELECT 
        ROUND((EXTRACT(EPOCH FROM (actual_return_time - end_time)) / 3600.0 * r.fine_per_hour)::numeric, 2),
        b.club_id
    INTO v_fine, v_club_id
    FROM bookings b
    JOIN resources r ON b.resource_id = r.resource_id
    WHERE b.booking_id = p_booking_id;

    IF v_fine > 0 AND v_club_id IS NOT NULL THEN
        UPDATE clubs
        SET current_balance = current_balance - v_fine,
            total_spent = total_spent + v_fine
        WHERE club_id = v_club_id;

        UPDATE bookings
        SET payment_status = 'late_fee_paid'
        WHERE booking_id = p_booking_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE VIEW club_overtime_reports AS
SELECT 
    b.booking_id,
    b.club_id,
    c.club_name,
    r.resource_name,
    b.end_time AS expected_return,
    b.actual_return_time,
    ROUND((EXTRACT(EPOCH FROM (b.actual_return_time - b.end_time)) / 3600.0)::numeric, 2) AS hours_overdue,
    r.fine_per_hour,
    ROUND((EXTRACT(EPOCH FROM (b.actual_return_time - b.end_time)) / 3600.0 * r.fine_per_hour)::numeric, 2) AS calculated_late_fee,
    b.payment_status
FROM bookings b
JOIN resources r ON b.resource_id = r.resource_id
JOIN clubs c ON b.club_id = c.club_id
WHERE b.actual_return_time > b.end_time 
  AND r.fine_per_hour > 0
  AND (b.payment_status IS NULL OR b.payment_status != 'late_fee_paid');