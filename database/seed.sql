-- 1. Wipe everything clean to start fresh
TRUNCATE TABLE roles, clubs, users, user_clubs, resources, bookings CASCADE;

-- 2. Rebuild the Foundational Roles
INSERT INTO roles (role_id, role_name) VALUES 
(1, 'Admin'),
(2, 'Club Secretary'),
(3, 'Faculty Incharge'),
(4, 'Student');

-- 3. Create Clubs (NOW WITH ALLOTTED BUDGETS)
INSERT INTO clubs (club_name, allocated_budget, current_balance) VALUES 
('Nirmaan', 25000.00, 25000.00),
('Department of Photography (DoPY)', 40000.00, 40000.00),
('CSIS Association', 50000.00, 50000.00),
('Sports Council', 60000.00, 60000.00),
('Waves Organizing Committee', 100000.00, 100000.00);

-- 4. Create Users (Password: '1234')
INSERT INTO users (bits_id, email, password_hash, full_name, role_id) VALUES 
('ADMIN-01', 'admin@goa.bits-pilani.ac.in', '1234', 'Campus Admin', 1),
('FAC-01', 'faculty@goa.bits-pilani.ac.in', '1234', 'Faculty', 3),
('2023A7PS0051G', 'f20230051@goa.bits-pilani.ac.in', '1234', 'Shreyas (Sports Sec)', 2),
('2023A7PS0052G', 'f20230052@goa.bits-pilani.ac.in', '1234', 'Haider (Waves Sec)', 2),
('2023A7PS0053G', 'f20230053@goa.bits-pilani.ac.in', '1234', 'Priya (Nirmaan Sec)', 2),
('2023A7PS0054G', 'f20230054@goa.bits-pilani.ac.in', '1234', 'Rahul (DoPY Sec)', 2),
('2023A7PS0055G', 'f20230055@goa.bits-pilani.ac.in', '1234', 'Aman (CSIS Sec)', 2),
('2024A7PS0001G', 'f20240001@goa.bits-pilani.ac.in', '1234', 'Kavya Makwana', 4),
('2024A7PS0002G', 'f20240002@goa.bits-pilani.ac.in', '1234', 'Vishwam', 4),
('2024A7PS0003G', 'f20240003@goa.bits-pilani.ac.in', '1234', 'Aadi', 4),
('2024A7PS0004G', 'f20240004@goa.bits-pilani.ac.in', '1234', 'Arth', 4),
('2024A7PS0005G', 'f20240005@goa.bits-pilani.ac.in', '1234', 'Tanishq', 4);

-- 5. LINK USERS TO CLUBS (Kavya linked to all)
INSERT INTO user_clubs (user_id, club_id) VALUES
((SELECT user_id FROM users WHERE full_name = 'Priya (Nirmaan Sec)'), (SELECT club_id FROM clubs WHERE club_name = 'Nirmaan')),
((SELECT user_id FROM users WHERE full_name = 'Rahul (DoPY Sec)'), (SELECT club_id FROM clubs WHERE club_name = 'Department of Photography (DoPY)')),
((SELECT user_id FROM users WHERE full_name = 'Aman (CSIS Sec)'), (SELECT club_id FROM clubs WHERE club_name = 'CSIS Association')),
((SELECT user_id FROM users WHERE full_name = 'Shreyas (Sports Sec)'), (SELECT club_id FROM clubs WHERE club_name = 'Sports Council')),
((SELECT user_id FROM users WHERE full_name = 'Haider (Waves Sec)'), (SELECT club_id FROM clubs WHERE club_name = 'Waves Organizing Committee')),
((SELECT user_id FROM users WHERE full_name = 'Kavya Makwana'), (SELECT club_id FROM clubs WHERE club_name = 'Nirmaan')),
((SELECT user_id FROM users WHERE full_name = 'Kavya Makwana'), (SELECT club_id FROM clubs WHERE club_name = 'Department of Photography (DoPY)')),
((SELECT user_id FROM users WHERE full_name = 'Kavya Makwana'), (SELECT club_id FROM clubs WHERE club_name = 'CSIS Association')),
((SELECT user_id FROM users WHERE full_name = 'Kavya Makwana'), (SELECT club_id FROM clubs WHERE club_name = 'Sports Council')),
((SELECT user_id FROM users WHERE full_name = 'Kavya Makwana'), (SELECT club_id FROM clubs WHERE club_name = 'Waves Organizing Committee')),
((SELECT user_id FROM users WHERE full_name = 'Vishwam'), (SELECT club_id FROM clubs WHERE club_name = 'Waves Organizing Committee')),
((SELECT user_id FROM users WHERE full_name = 'Aadi'), (SELECT club_id FROM clubs WHERE club_name = 'Sports Council')),
((SELECT user_id FROM users WHERE full_name = 'Arth'), (SELECT club_id FROM clubs WHERE club_name = 'CSIS Association')),
((SELECT user_id FROM users WHERE full_name = 'Tanishq'), (SELECT club_id FROM clubs WHERE club_name = 'Department of Photography (DoPY)'));

-- 6. Create Resources (Full Inventory)
INSERT INTO resources (resource_name, hourly_rate, fine_per_hour, status, maintenance_eta) VALUES 
('Campus Activa (GA06-1111)', 50.00, 100.00, 'available', NULL),
('Campus Activa (GA06-2222)', 50.00, 100.00, 'maintenance', '2026-04-20 10:00:00'),
('Main Auditorium', 0.00, 500.00, 'available', NULL),
('Lecture Theatre 1 (LT1)', 0.00, 200.00, 'available', NULL),
('Lecture Theatre 2 (LT2)', 0.00, 200.00, 'available', NULL),
('Classroom A314', 0.00, 50.00, 'available', NULL),
('Student Activity Centre (SAC)', 0.00, 300.00, 'available', NULL),
('Sony A7SIII Camera', 250.00, 300.00, 'available', NULL),
('DJI Ronin Gimbal', 100.00, 150.00, 'available', NULL),
('Heavy Duty Projector', 150.00, 100.00, 'available', NULL),
('Yamaha PA System', 200.00, 250.00, 'available', NULL),
('JBL PartyBox 710', 100.00, 150.00, 'maintenance', '2026-04-25 12:00:00'),
('Cricket Kit Pro (Full)', 0.00, 100.00, 'available', NULL),
('Tug of War Rope', 0.00, 50.00, 'available', NULL),
('Heavy Duty Extension Cords (x5)', 0.00, 20.00, 'available', NULL),
('Portable Whiteboards (Set of 3)', 0.00, 50.00, 'available', NULL);

-- 7. Create Bookings

-- 🔴 LATE RETURNS (For Overdue Notice demo in Haider's dashboard)
-- This was returned 4 hours late. Fine: 4 hrs * 100 = ₹400
INSERT INTO bookings (resource_id, user_id, club_id, start_time, end_time, actual_return_time, purpose, approval_status, payment_status) VALUES 
((SELECT resource_id FROM resources WHERE resource_name = 'Campus Activa (GA06-1111)'), 
 (SELECT user_id FROM users WHERE full_name = 'Haider (Waves Sec)'), 
 (SELECT club_id FROM clubs WHERE club_name = 'Waves Organizing Committee'),
 '2026-04-12 10:00:00', '2026-04-12 14:00:00', '2026-04-12 18:00:00', 'Supplies pickup from Vasco', 'approved_by_faculty', 'late_fee_pending');

-- 🟢 Fully Approved (History)
INSERT INTO bookings (resource_id, user_id, club_id, start_time, end_time, purpose, approval_status) VALUES 
((SELECT resource_id FROM resources WHERE resource_name = 'Lecture Theatre 1 (LT1)'), 
 (SELECT user_id FROM users WHERE full_name = 'Kavya Makwana'), 
 (SELECT club_id FROM clubs WHERE club_name = 'CSIS Association'),
 '2026-04-10 17:00:00', '2026-04-10 19:00:00', 'CSIS Technical Workshop', 'approved_by_faculty');

-- 🟡 Pending Sec Approval
INSERT INTO bookings (resource_id, user_id, club_id, start_time, end_time, purpose, approval_status) VALUES 
((SELECT resource_id FROM resources WHERE resource_name = 'Cricket Kit Pro (Full)'), 
 (SELECT user_id FROM users WHERE full_name = 'Aadi'), 
 (SELECT club_id FROM clubs WHERE club_name = 'Sports Council'),
 '2026-04-22 16:00:00', '2026-04-22 19:00:00', 'Inter-hostel practice', 'pending');

-- 🔵 Sec Approved / Pending Faculty
INSERT INTO bookings (resource_id, user_id, club_id, start_time, end_time, purpose, approval_status) VALUES 
((SELECT resource_id FROM resources WHERE resource_name = 'Main Auditorium'), 
 (SELECT user_id FROM users WHERE full_name = 'Arth'), 
 (SELECT club_id FROM clubs WHERE club_name = 'CSIS Association'),
 '2026-04-25 18:00:00', '2026-04-25 22:00:00', 'Guest Lecture Logistics', 'approved_by_secretary');

-- 🔴 Rejected 
INSERT INTO bookings (resource_id, user_id, club_id, start_time, end_time, purpose, approval_status) VALUES 
((SELECT resource_id FROM resources WHERE resource_name = 'Yamaha PA System'), 
 (SELECT user_id FROM users WHERE full_name = 'Kavya Makwana'), 
 NULL, 
 '2026-04-18 20:00:00', '2026-04-18 23:59:00', 'Birthday Party', 'rejected');