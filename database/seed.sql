-- 1. Wipe everything clean to start fresh
TRUNCATE TABLE roles, clubs, users, resources, bookings CASCADE;

-- 2. Rebuild the Foundational Roles
INSERT INTO roles (role_id, role_name) VALUES 
(1, 'Admin'),
(2, 'Club Secretary'),
(3, 'Faculty Incharge'),
(4, 'Student');

-- 3. Create Clubs 
INSERT INTO clubs (club_name) VALUES 
('Nirmaan'),
('Department of Photography (DoP)'),
('CSIS Association'),
('Sports Council'),
('Waves Organizing Committee');

-- 4. Create Users (Password is '1234' for everyone)
INSERT INTO users (bits_id, email, password_hash, full_name, role_id) VALUES 
-- Admins & Faculty
('ADMIN-01', 'admin@goa.bits-pilani.ac.in', '1234', 'Campus Admin', 1),
('FAC-01', 'faculty@goa.bits-pilani.ac.in', '1234', 'Dr. CSIS Faculty', 3),

-- Secretaries (Role 2) - 2023 Batch
('2023A7PS0051G', 'f20230051@goa.bits-pilani.ac.in', '1234', 'Shreyas (Sports Sec)', 2),
('2023A7PS0052G', 'f20230052@goa.bits-pilani.ac.in', '1234', 'Haider (Waves Sec)', 2),

-- Students (Role 4) - 2024 Batch
('2024A7PS0001G', 'f20240001@goa.bits-pilani.ac.in', '1234', 'Kavya Makwana', 4),
('2024A7PS0002G', 'f20240002@goa.bits-pilani.ac.in', '1234', 'Vishwam', 4),
('2024A7PS0003G', 'f20240003@goa.bits-pilani.ac.in', '1234', 'Aadi', 4),
('2024A7PS0004G', 'f20240004@goa.bits-pilani.ac.in', '1234', 'Arth', 4),
('2024A7PS0005G', 'f20240005@goa.bits-pilani.ac.in', '1234', 'Tanishq', 4);

-- 5. Create Resources (The College Inventory)
INSERT INTO resources (resource_name, hourly_rate, status, maintenance_eta) VALUES 
-- Transport
('Campus Activa (GA06-1111)', 50.00, 'available', NULL),
('Campus Activa (GA06-2222)', 50.00, 'maintenance', '2026-04-20 10:00:00'),

-- Venues & Classrooms
('Main Auditorium', 0.00, 'available', NULL),
('Lecture Theatre 1 (LT1)', 0.00, 'available', NULL),
('Lecture Theatre 2 (LT2)', 0.00, 'available', NULL),
('Classroom A314', 0.00, 'available', NULL),
('Student Activity Centre (SAC)', 0.00, 'available', NULL),

-- Tech & AV
('Sony A7SIII Camera', 250.00, 'available', NULL),
('DJI Ronin Gimbal', 100.00, 'available', NULL),
('Heavy Duty Projector', 150.00, 'available', NULL),
('Yamaha PA System', 200.00, 'available', NULL),
('JBL PartyBox 710', 100.00, 'maintenance', '2026-04-25 12:00:00'),

-- Sports & Logistics
('Cricket Kit Pro (Full)', 0.00, 'available', NULL),
('Tug of War Rope', 0.00, 'available', NULL),
('Heavy Duty Extension Cords (x5)', 0.00, 'available', NULL),
('Portable Whiteboards (Set of 3)', 0.00, 'available', NULL);

-- 6. Create Bookings (Populating the Action Queues and Ledgers)

-- 🟢 Fully Approved & Past (Shows history in the Ledger)
INSERT INTO bookings (resource_id, user_id, start_time, end_time, purpose, approval_status) VALUES 
((SELECT resource_id FROM resources WHERE resource_name = 'Lecture Theatre 1 (LT1)'), 
 (SELECT user_id FROM users WHERE full_name = 'Kavya Makwana'), 
 '2026-04-10 17:00:00', '2026-04-10 19:00:00', 'CSIS Study Jam Session', 'approved_by_faculty');

INSERT INTO bookings (resource_id, user_id, start_time, end_time, purpose, approval_status) VALUES 
((SELECT resource_id FROM resources WHERE resource_name = 'Campus Activa (GA06-1111)'), 
 (SELECT user_id FROM users WHERE full_name = 'Haider (Waves Sec)'), 
 '2026-04-11 09:00:00', '2026-04-11 14:00:00', 'Purchasing fest supplies from Mapusa', 'approved_by_faculty');

-- 🟡 Pending Sec Approval (Shows up in Secretary Action Queue)
INSERT INTO bookings (resource_id, user_id, start_time, end_time, purpose, approval_status) VALUES 
((SELECT resource_id FROM resources WHERE resource_name = 'Cricket Kit Pro (Full)'), 
 (SELECT user_id FROM users WHERE full_name = 'Aadi'), 
 '2026-04-22 16:00:00', '2026-04-22 19:00:00', 'Inter-hostel sports practice', 'pending');

INSERT INTO bookings (resource_id, user_id, start_time, end_time, purpose, approval_status) VALUES 
((SELECT resource_id FROM resources WHERE resource_name = 'Sony A7SIII Camera'), 
 (SELECT user_id FROM users WHERE full_name = 'Tanishq'), 
 '2026-04-23 10:00:00', '2026-04-23 18:00:00', 'Shooting promotional video for DoP', 'pending');

-- 🔵 Sec Approved / Pending Faculty (Shows up in Faculty Action Queue)
INSERT INTO bookings (resource_id, user_id, start_time, end_time, purpose, approval_status) VALUES 
((SELECT resource_id FROM resources WHERE resource_name = 'Main Auditorium'), 
 (SELECT user_id FROM users WHERE full_name = 'Arth'), 
 '2026-04-25 18:00:00', '2026-04-25 22:00:00', 'Guest speaker event logistics setup', 'approved_by_secretary');

INSERT INTO bookings (resource_id, user_id, start_time, end_time, purpose, approval_status) VALUES 
((SELECT resource_id FROM resources WHERE resource_name = 'Heavy Duty Extension Cords (x5)'), 
 (SELECT user_id FROM users WHERE full_name = 'Vishwam'), 
 '2026-04-21 08:00:00', '2026-04-21 20:00:00', 'Wiring setup for stage lights', 'approved_by_secretary');

-- 🔴 Rejected (Shows in Ledger and Student's personal bookings)
INSERT INTO bookings (resource_id, user_id, start_time, end_time, purpose, approval_status) VALUES 
((SELECT resource_id FROM resources WHERE resource_name = 'Yamaha PA System'), 
 (SELECT user_id FROM users WHERE full_name = 'Kavya Makwana'), 
 '2026-04-18 20:00:00', '2026-04-18 23:59:00', 'Personal hostel birthday party', 'rejected');