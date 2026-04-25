# BITS Goa: Inventory & Resource Scheduler (IRS) 🎓

The **BITS Goa Inventory & Resource Scheduler (IRS)** is a comprehensive, full-stack database management system designed to streamline the booking and management of campus resources. Built specifically for the BITS Pilani Goa Campus ecosystem, it resolves scheduling conflicts, automates club budget deductions, and enforces strict, role-based access control across students, club secretaries, faculty, and campus admins.

At its core, IRS is engineered around a highly robust, **Third Normal Form (3NF) PostgreSQL relational database**, featuring advanced PL/pgSQL concurrency triggers, automated financial ledgers, and a React-based frontend dashboard.

**Check out the [System Demo & Screenshots](./DEMO.md) to see the IRS in action!**

---

## 👥 The Team & Roles

This system was developed by a 7-person team, with responsibilities distributed across a unified technical stack:

| Member | Role | Core Responsibility |
| :--- | :--- | :--- |
| **Kavya** | Frontend Lead | React (Vite) UI/UX, responsive dashboards, and client-side integration. |
| **Vishwam** | Backend Lead | RESTful API architecture and Express.js routing (`/bookings`, `/resources`). |
| **Tanishq** | Database Architect | 3NF schema design, constraints, relational mapping (`user_clubs`), and data integrity. |
| **Aadi** | Concurrency Specialist | PL/pgSQL triggers and transaction isolation (`OVERLAPS`) to prevent double-bookings. |
| **Arth** | Auth & Security Lead | JWT authentication, secure login, and Role-Based Access Control middleware. |
| **Shreyas** | Finance Module Lead | SQL budget tracking, automated fine calculations, and financial views/dashboarding. |
| **Haider** | DevOps & System Admin | Environment configuration, mock data structuring (`seed.sql`), and overarching system flow. |

---

## 🛠️ Tech Stack

* **Database:** PostgreSQL 15 (Relational Data, ACID Transactions, PL/pgSQL Triggers)
* **Backend:** Node.js, Express.js
* **Frontend:** React.js (Vite), Tailwind CSS
* **Security & Auth:** JSON Web Tokens (JWT)
* **API Communication:** Axios

---

## ✨ Core Modules & Technical Highlights

### 1. Database Architecture & Concurrency
* **Normalized 3NF Schema:** A 10-table architecture that strictly separates independent entities (Roles, Departments, Clubs) from transactional logs, eliminating update anomalies.
* **M:N Relationship Handling:** Implemented a `user_clubs` junction table, allowing a single user (like Kavya) to be part of multiple clubs while cleanly tracking permissions.
* **Zero Double-Bookings:** A `BEFORE INSERT` trigger (`prevent_double_booking`) utilizes PostgreSQL's native `OVERLAPS` function to guarantee zero scheduling conflicts at the database level.

### 2. Automated Finance & Budgeting
* **Dynamic Cost Calculation:** The `calculate_cost_and_check_funds` trigger dynamically computes the total booking cost (`hourly_rate` × hours booked) and strictly blocks the transaction if the club has insufficient funds.
* **Automated Ledger:** The `process_payment_on_approval` trigger automatically deducts funds from the club's `current_balance` the moment a faculty member approves a booking.
* **Overtime Tracking:** A dedicated SQL View (`club_overtime_reports`) tracks late returns and calculates dynamic fines using `EXTRACT(EPOCH...)`, which secretaries can settle via the `/api/finance/settle-fine` endpoint.

### 3. API Architecture & Security
* **Role-Based Access Control (RBAC):** The `verifyToken` middleware unpacks JWTs to enforce strict authorization. Students (`role_id: 4`) are explicitly blocked from accessing admin queues, maintenance toggles, or financial ledgers.
* **Secure Token Payload:** The JWT encodes the user's specific array of `club_ids`, allowing the backend to instantly filter dashboards and ledgers based on the user's club affiliations without redundant database queries.

---

## 📁 Repository Structure

```text
📦 bits-irs
 ┣ 📂 database/               # Database Architecture
 ┃ ┣ 📜 schema.sql            # Master DB schema, enums, views, & triggers
 ┃ ┗ 📜 seed.sql              # Mock BITS Goa data (Clubs, Users, Inventory)
 ┣ 📂 backend/                # Node.js + Express API
 ┃ ┣ 📂 src/
 ┃ ┃ ┣ 📂 config/
 ┃ ┃ ┃ ┗ 📜 db.js             # PostgreSQL connection pool
 ┃ ┃ ┣ 📂 middleware/
 ┃ ┃ ┃ ┗ 📜 auth.js           # JWT verification & RBAC logic
 ┃ ┃ ┣ 📂 routes/
 ┃ ┃ ┃ ┣ 📜 auth.js           # /api/auth/login
 ┃ ┃ ┃ ┣ 📜 bookings.js       # /api/bookings (queue, ledger, approvals, return)
 ┃ ┃ ┃ ┣ 📜 finance.js        # /api/finance (wallet dashboard, settle fines)
 ┃ ┃ ┃ ┗ 📜 resources.js      # /api/resources (inventory fetch, maintenance toggle)
 ┃ ┃ ┗ 📜 server.js           # Express app initialization & route mounting
 ┃ ┣ 📜 .env.example          # Environment variable template
 ┃ ┣ 📜 package.json
 ┃ ┗ 📜 package-lock.json
 ┣ 📂 frontend/               # React + Vite Application
 ┃ ┣ 📂 public/
 ┃ ┃ ┣ 📜 favicon.svg
 ┃ ┃ ┗ 📜 icons.svg
 ┃ ┣ 📂 src/
 ┃ ┃ ┣ 📂 api/
 ┃ ┃ ┃ ┗ 📜 axiosClient.js    # Pre-configured Axios instance with auth interceptors
 ┃ ┃ ┣ 📂 assets/
 ┃ ┃ ┣ 📂 components/
 ┃ ┃ ┃ ┣ 📜 Navbar.jsx
 ┃ ┃ ┃ ┗ 📜 FinanceReport.jsx # Renders data from club_overtime_reports view
 ┃ ┃ ┣ 📂 pages/
 ┃ ┃ ┃ ┣ 📜 Login.jsx
 ┃ ┃ ┃ ┗ 📜 Dashboard.jsx     # Main role-based interface
 ┃ ┃ ┣ 📜 App.jsx
 ┃ ┃ ┣ 📜 main.jsx
 ┃ ┃ ┗ 📜 index.css           # Tailwind directives
 ┃ ┣ 📜 tailwind.config.js
 ┃ ┣ 📜 vite.config.js
 ┃ ┗ 📜 package.json
 ┣ 📜 .gitignore
 ┗ 📜 README.md
```

### 🚀 Local Setup & Installation

### Prerequisites
* Node.js (v18+)
* PostgreSQL (v15+)

### 1. Database Setup
1. Create a PostgreSQL database named `irsdb`.
2. Execute the schema file to build the architecture:
   ```bash
   psql -U your_postgres_user -d irsdb -f database/schema.sql
3. Execute the seed file to populate the mock BITS Goa data:
   ```bash
   psql -U your_postgres_user -d irsdb -f database/seed.sql

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
2. Install dependencies:
   ```bash
   npm install
3. Create a `.env` file based on `.env.example`:
   ```env
   POSTGRES_USER=your_postgres_user
   POSTGRES_PASSWORD=your_password
   POSTGRES_DB=irsdb
   JWT_SECRET=your_super_secret_key
   PORT=5000
4. Start the development server:
   ```bash
   npm run dev

### 3. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
2. Install dependencies:
   ```bash
   npm install
3. Start the Vite development server:
   ```bash
   npm run dev
4. Open your browser and navigate to http://localhost:5173.

## 🔑 Test Credentials (From `seed.sql`)
All mock users have the password: `1234`

* **Admin:** `admin@goa.bits-pilani.ac.in`
* **Faculty:** `faculty@goa.bits-pilani.ac.in`
* **Club Secretary:** `f20230053@goa.bits-pilani.ac.in` (Nirmaan Sec)
* **Student:** `f20240001@goa.bits-pilani.ac.in` (Kavya - Multi-club access)

---

   
