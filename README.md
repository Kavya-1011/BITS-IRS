# BITS Goa: Inventory & Resource Scheduler (IRS) 🎓

A full-stack, Role-Based Access Control (RBAC) application designed to manage campus inventory, prevent double-bookings, and handle approval workflows for student clubs. 

## 🛠️ Tech Stack
* **Database:** PostgreSQL (3NF Schema, Custom PL/pgSQL Triggers)
* **Backend:** Node.js, Express.js, JWT Authentication
* **Frontend:** React (Vite), Tailwind CSS

---

## 🚀 Local Setup Guide

Follow these steps to get the application running on your local machine.

### 1. Prerequisites
Ensure you have the following installed:
* [Node.js](https://nodejs.org/) (v18+)
* [PostgreSQL](https://www.postgresql.org/) (v14+)

### 2. Database Initialization
1. Open your terminal and log into your local PostgreSQL instance:
   ```bash
   psql -U postgres

Create the project database:
    SQL

    CREATE DATABASE irsdb;
    \q

    Inject the schema and mock data (ensure you are in the project root):
    Bash

    psql -U postgres -d irsdb -f database/schema.sql
    psql -U postgres -d irsdb -f database/seed.sql

3. Backend Setup

    Navigate to the backend directory:
    Bash

    cd backend
    npm install

    Configure your environment variables:

        Duplicate the .env.example file and rename it to .env.

        Open .env and update the POSTGRES_PASSWORD to match your local PostgreSQL password.

    Start the Express API:
    Bash

    node src/server.js

4. Frontend Setup

    Open a new terminal window and navigate to the frontend directory:
    Bash

    cd frontend
    npm install

    Start the Vite development server:
    Bash

    npm run dev

    Open your browser and navigate to http://localhost:5173.

🧪 Default Test Accounts

The seed.sql file provisions several mock accounts you can use to test the RBAC approval pipeline. Use these to log in on the frontend:

1. The Student (Requester)

    Email: f20240001@goa.bits-pilani.ac.in

    Password: hashed_pw_1

    Role: Can view inventory and request bookings. Has a "My Bookings" ledger.

2. The Club Secretary (Approver)

    Email: f20240002@goa.bits-pilani.ac.in

    Password: hashed_pw_2

    Role: Has access to an "Action Queue" to Approve or Reject pending student requests.