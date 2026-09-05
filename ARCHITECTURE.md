# AI-Based Governance & Compliance Monitoring System
## Architecture & Design Document

### 1. Application Architecture

The system follows a modern **Full-Stack Microservices-inspired Architecture**, designed for scale, resilience, and secure access.

*   **Frontend**: React (Vite) + Tailwind CSS. The frontend is a Single Page Application (SPA) utilizing React Router for role-based navigation.
*   **Backend**: Node.js / Express API Server. Designed to scale horizontally.
*   **Database**: PostgreSQL (managed via Supabase). The prototype uses an in-memory datastore representing the relational structures.
*   **Authentication**: Custom JWT-based Role-Based Access Control (RBAC) supporting OAuth 2.0 paradigms.
*   **AI Layer**: Google Gemini API integration for anomaly detection, report classification, and predictive compliance.

#### 1.1 High-Level Architecture Diagram (Logical)

\`\`\`text
[ Worker Mobile App / PWA ]   [ Mine Manager Web Panel ]   [ Ministry Admin Web Panel ]
             |                             |                            |
             +-----------------------------+----------------------------+
                                           |
                                [ Nginx / API Gateway ]
                                           |
                    +----------------------+----------------------+
                    |                                             |
            [ Auth Service ]                              [ Core API Service ]
            - JWT Minting                                 - Hazard Reporting
            - 2FA & Verification                          - Production Tracking
            - RBAC Enforcement                            - Compliance Engine
                    |                                             |
                    +----------------------+----------------------+
                                           |
                                [ PostgreSQL / Supabase ]
                                           |
                                [ External Integrations ]
                      - Gemini AI API (Intelligence & Classification)
                      - Twilio (SMS/SOS Alerts)
                      - CCTV / RTSP Feed Handlers
\`\`\`

---

### 2. Database Schema (Entity Relationships)

The primary database is PostgreSQL. Below is the schema representation:

#### `Users` Table
*   `id` (UUID, PK)
*   `name` (VARCHAR)
*   `email` (VARCHAR, Unique)
*   `password_hash` (VARCHAR)
*   `role` (ENUM: 'admin', 'manager', 'worker')
*   `status` (ENUM: 'pending', 'approved', 'rejected')
*   `mine_id` (FK -> Mines.id, Nullable)
*   `designation` (VARCHAR, Nullable)
*   `created_at` (TIMESTAMP)

#### `Mines` Table
*   `id` (UUID, PK)
*   `name` (VARCHAR)
*   `location` (VARCHAR)
*   `type` (ENUM: 'Open Cast', 'Underground')
*   `status` (VARCHAR)

#### `Incidents` Table (Hazard Reports & SOS)
*   `id` (UUID, PK)
*   `mine_id` (FK -> Mines.id)
*   `reported_by` (FK -> Users.id)
*   `title` (VARCHAR)
*   `description` (TEXT)
*   `type` (ENUM: 'gas_leak', 'structural', 'electrical', 'sos', 'other')
*   `severity` (ENUM: 'Low', 'Medium', 'High', 'Critical')
*   `status` (ENUM: 'Open', 'Investigating', 'Resolved')
*   `lat` (FLOAT, Nullable)
*   `lng` (FLOAT, Nullable)
*   `created_at` (TIMESTAMP)

#### `Production_Logs` Table
*   `id` (UUID, PK)
*   `mine_id` (FK -> Mines.id)
*   `date` (DATE)
*   `target_mt` (FLOAT)
*   `actual_mt` (FLOAT)
*   `manager_id` (FK -> Users.id)

#### `Compliance_Scores` Table
*   `id` (UUID, PK)
*   `mine_id` (FK -> Mines.id)
*   `score` (FLOAT)
*   `week_start_date` (DATE)
*   `ai_risk_rating` (VARCHAR)

---

### 3. API Route Structure

All routes fall under `/api/v1/`.

#### Authentication (`/auth`)
*   \`POST /auth/register\` - Create a new user (default state: pending).
*   \`POST /auth/login\` - Authenticate and receive JWT.
*   \`POST /auth/verify-otp\` - 2FA for Ministry Admins.

#### Ministry Admin (`/admin`) -> *Requires 'admin' role*
*   \`GET /admin/dashboard\` - Aggregated national statistics.
*   \`GET /admin/users\` - List users (pending and active).
*   \`PUT /admin/users/:id/status\` - Approve/Reject users.
*   \`GET /admin/mines\` - Global mine registry.
*   \`POST /admin/show-cause\` - Issue a show-cause notice to a mine.

#### Mine Manager (`/manager`) -> *Requires 'manager' role*
*   \`GET /manager/dashboard\` - Mine-specific statistics.
*   \`POST /manager/production\` - Submit daily production report.
*   \`GET /manager/incidents\` - View hazard reports and SOS alerts.
*   \`PUT /manager/incidents/:id\` - Update incident status.
*   \`POST /manager/inspection\` - Submit safety inspection checklist.

#### Worker (`/worker`) -> *Requires 'worker' role*
*   \`GET /worker/profile\` - Fetch attendance and health check info.
*   \`POST /worker/hazard\` - Submit a new hazard report.
*   \`POST /worker/sos\` - Trigger emergency SOS protocol.

---

### 4. Role Permission Matrix

| Feature | Worker | Mine Manager | Ministry Admin |
| :--- | :---: | :---: | :---: |
| **Login** | ✅ (If Approved) | ✅ (If Approved) | ✅ (+ 2FA) |
| **Trigger SOS** | ✅ | ❌ | ❌ |
| **Report Hazard** | ✅ | ✅ | ❌ |
| **View Safety PDFs** | ✅ | ✅ | ✅ |
| **Submit Production Data** | ❌ | ✅ | ❌ |
| **Manage Local Mine Gear** | ❌ | ✅ | ❌ |
| **View CCTV Feeds** | ❌ | ✅ | ✅ |
| **Approve User Registrations** | ❌ | ❌ | ✅ |
| **Issue Show Cause Notices** | ❌ | ❌ | ✅ |
| **View National Dashboards** | ❌ | ❌ | ✅ |

---

### 5. Screen-by-Screen UI Description

#### 5.1 Login & Registration (Public)
*   **Login**: Clean form asking for Email and Password. Upon submission, the API verifies the credentials AND the \`status\` (must be 'approved').
*   **Registration**: Fields for Full Name, Email, Password, Role Dropdown (Worker/Manager), and Mine ID. If Worker is selected, a Designation dropdown appears (Miner, Driver, Blaster, etc.).

#### 5.2 Worker Panel (Mobile-First SPA)
*   **Dashboard**: High-contrast, easy-to-read mobile UI. Shows Profile, Mine info, and a prominent counter for Attendance and next Health Check.
*   **SOS Button**: A massive red button anchored to the screen. Requires a 3-second hold (with visual progress bar) to prevent accidental presses. Triggers a high-priority incident with GPS coordinates.
*   **Action Grid**: 4 large touch-friendly buttons: "Report Hazard" (opens camera/form), "Safety Info" (PDF list), "My Welfare" (medical history), and "Notifications".

#### 5.3 Mine Manager Panel (Tablet/Desktop)
*   **Dashboard**: Sidebar navigation. Main view contains a KPI grid (Active Miners, Today's Production vs Target, Open Incidents, Inspections Due).
*   **Production & Incidents**: A split view showing recent hazard reports from workers (with quick "Investigate" buttons) and daily production input fields.
*   **CCTV Module**: A grid layout ready to embed live RTSP feeds of various mine zones.

#### 5.4 Ministry Admin Panel (Desktop)
*   **Dashboard**: High-level national overview. KPIs include Active Mines, Total Workforce, National Open Incidents, and Average Compliance Score.
*   **Verification Queue**: A dedicated widget showing pending registrations from Workers and Managers, requiring the Admin to click 'Approve' or 'Reject'.
*   **Compliance 3D Chart**: (To be implemented via Three.js/Recharts) Visualizing the safety and reporting compliance of various mines to easily spot outliers.

---

### 6. AI Features Integration (Gemini)

1.  **Anomaly Detection**: The API runs a cron job analyzing the \`Production_Logs\` and \`Incidents\` tables. If a mine reports a 20% drop in production alongside a spike in structural reports, Gemini flags it as a "High-Risk Anomaly".
2.  **NLP Hazard Classification**: When a worker types "The roof near section B looks cracked", the backend sends this text to Gemini, which automatically classifies the type as \`structural\` and severity as \`High\`, bypassing the need for the worker to fill out complex forms in a dangerous environment.
3.  **Smart Show Cause Trigger**: When the AI computes a sustained low Compliance Score over 3 weeks, it drafts a Show Cause Notice and presents it to the Ministry Admin for a 1-click approval.
