# ED Huddle and Action Management System

> **A Frontline NHS Operational Application Prototype**  
> Designed to replace Excel-based Emergency Department huddle and action-tracking workflows with an auditable, high-density, real-time web application.

---

## ⚠️ Important Governance Notice

* **Demonstration Prototype Only**: This application runs entirely in your local browser using structured, fictional demonstration records.
* **No Connection to Real Patient Data**: Does **not** connect to Cerner Millennium, CADOnline, Spine, SharePoint, Dataverse, or live NHS Trust networks.
* **Fictional Data Only**: All initials, bed locations, and clinical comments are fictitious. Do not enter real patient-identifiable information (PII).

---

## 🏥 Key Features & Workflows

### 1. Live Huddle Workspace (Main Operational Screen)
* **Fast List Working & Inline Editing**:
  * **On-the-Fly Editing**: Click directly into *Action Required*, *Action Holder*, *Status*, or *General Comments* to edit instantly in the list without opening modals. Enter saves, Shift+Enter adds newlines, and Escape cancels.
  * **Escalation Flagging**: One-click toggle button on each row to flag clinical escalations or designate escalation leads (`→ Radiology`, `→ Bed Management`).
  * **Click-and-Drag Row Selection**: Click and drag down the checkbox, LOS badge, area/bed, or initials columns to rapidly select or deselect rows (works on both mouse and touch devices). Shift+Click allows continuous range selection.
  * **Bulk Action Toolbar**: Contextual toolbar showing the count of selected rows with one-click actions: batch status update (*In Progress*, *Awaiting Update*, *Completed*), batch holder assignment, bulk transfer to the next huddle, and deletion.
* **HTML / CSV Tool Copy-Paste Importer**:
  * Eliminates tedious 1-by-1 patient creation: Copy the output of the secondary operational HTML tool (columns: `LOS`, `Location`, `Initials`) and paste it directly.
  * The intelligent parser automatically handles tab-delimited HTML tables, CSVs, space-separated lines, and multiple column orders.
  * Real-time preview identifies existing patients in the huddle (updating their current length-of-stay while preserving existing notes) vs. newly arrived patients.
* **24-Hour Timeline Ribbon**: Quick navigation across scheduled huddles (`10:00 Dispo`, `13:00`, `16:00`, `18:00 Dispo`, `21:00`, `00:00`, `04:30`).
* **KPI Metrics Bar**: Live department census, 12-hour DTA breaches, doctor wait time, triage duration, and color-coded length-of-stay (LOS) distribution (`<2h`, `2–3h`, `3–4h`, `4–12h`, `>12h`).
* **High-Density Action Table**: Instant search, multi-parameter filtering (Status, Priority, Location, Action Holder), and quick row actions.
* **Transfer Unactioned (Core Workflow)**: Prominent multi-step handover modal that moves uncompleted or unresolved actions into a future huddle, preserves the parent record for audit, marks it as `Transferred`, links `sourceActionId`, and prevents duplicate transfers.
* **Instant Handover Summary**: One-click printable briefing generation for the clinical lead.

### 2. Actions Management Registry
* Comprehensive cross-huddle tracker with quick filter presets: *All Active*, *My Department Actions*, *Critical Risks & Escalations*, *Overdue (>12h)*, *Completed*, and *Transferred*.
* One-click **Export to CSV** supporting current filtered views.

### 3. ED State of Play (Department Snapshot)
* Real-time capacity recording: Total ED count, bed waits (DTA), >12h and >24h breaches, staffed treatment spaces, and current pressure tier (OPEL 1 to 4).
* **Main Pressures**: Select up to three primary system drivers (Bed Capacity, Patient Flow, Diagnostics, Staffing, etc.).
* **Areas Under Pressure**: Multi-select clinical zones (Waiting Room, Majors, Resus, CDU, Paediatrics, Mental Health, Assessment Areas).
* **Trend & Structured Notes**: Direction of travel (Improving, Stable, Deteriorating), operational risks, positive developments, and formal clinical escalations.
* **Copy Previous Snapshot**: Clones telemetry from the previous shift and visibly highlights copied fields for fast clinical verification.

### 4. Overnight Operational Dashboard
* **Date & Shift Selectors**: Historical date review and 24-hour reporting period.
* **8 KPI Cards**: Completed huddles, actions raised, resolution rate, critical risks, formal escalations, and highest recorded OPEL pressure.
* **12 Structured Handover Sections**:
  1. Deterministic Executive Summary (transparent rule-based generation with explicit prototype badge)
  2. 24-Hour Pressure & Inflow Timeline (interactive Recharts line chart)
  3. Operational Pressure Themes Frequency (Recharts bar chart)
  4. Action Resolution Breakdown (Recharts donut chart)
  5. Acuity & Priority Distribution
  6. Positive Developments & Mitigations
  7. Outstanding Critical Actions Table
  8. Department Clinical Escalations & Duty Responses
  9. Day Team Handover Priorities
  10. Source Telemetry & Governance Status (active vs. planned future feeds)
  11. Chronological Event Timeline
* **Handover Print Layout**: Dedicated print mode (`@media print`) hiding toolbars, filters, and navigation for seamless physical handover printouts.

### 5. Huddle History & Audit Archive
* Chronological archive of all past operational huddles with read-only summary modals, template duplication, and completed huddle editing guards requiring an explicit audit reason.

### 6. Settings, Backup & Reset
* Customizable department name, Trust name, bed locations, and action owners.
* Full JSON database **Export** and **Import** for testing scenarios.
* One-click **Reset Demonstration Data** returning the app to its baseline seed state.

---

## 🛠️ Technology Stack

* **Framework**: React 18 with TypeScript (Strict mode)
* **Build Tool**: Vite 5
* **Styling**: Tailwind CSS configured with official NHS color tokens (`#005EB8`, `#003087`, `#007F3B`, `#ED8B00`, `#DA291C`, `#7C3AED`)
* **Icons**: Lucide React
* **Data Visualization**: Recharts
* **Routing**: React Router DOM (v6)
* **Architecture**: Interface-based Repository Pattern (`IHuddleRepository`, `IActionRepository`, `ISnapshotRepository`, `IAuditRepository`, `IReportRepository`) with LocalStorage implementations and placeholder interfaces for future REST / Dataverse / FHIR backends.
* **Testing Suite**: Vitest for core business logic, duplicate-transfer guards, and report calculation tests.

---

## 🚀 Getting Started

### Prerequisites
* Node.js (v18.15+ or later)
* npm (v9.0+ or later)

### Installation

```bash
# Clone or navigate into the project directory
cd "c:\Users\Nhyxz\Desktop\huddele app"

# Install dependencies
npm install
```

### Running Locally

```bash
# Start Vite development server
npm run dev
```
Open your browser and navigate to `http://localhost:5173`.

### Running Automated Tests

```bash
# Execute Vitest test suite
npm test
```

### Production Build & Preview

```bash
# Compile TypeScript and bundle production assets
npm run build

# Preview production build locally
npm run preview
```

---

## 👥 Demonstration Roles

Use the **Demo Role** dropdown in the top navigation bar to test UI perspectives:
1. **Huddle Coordinator**: Full access to edit, transfer actions, and manage huddles.
2. **Nurse in Charge**: Clinical and capacity focus (State of Play and action tracking).
3. **Operational Manager**: Overview of performance, reporting, and escalations.
4. **Read Only Viewer**: Inspection mode (creation and editing controls disabled).
5. **System Administrator**: Full system configuration, JSON backup, and data reset.

---

## 📂 Architecture & Directory Structure

```
src/
├── components/          # Reusable NHS UI components (Navbar, Sidebar, BottomBar, AuditLogModal)
├── context/             # Global AppContext managing state, notifications, and repositories
├── features/
│   ├── live-huddle/     # Table, timeline ribbon, summary cards, drawer, transfer modal
│   └── ...
├── mock-data/           # Seed datasets (7 huddles, 25+ actions, snapshots, audit events)
├── models/              # Strict TypeScript models and domain types
├── pages/               # Top-level view routes (LiveHuddle, Actions, Snapshot, Dashboard, History, Settings)
├── repositories/        # Repository pattern with LocalStorage implementations
│   ├── interfaces/      # Contracts (IHuddleRepository, ApiHuddleRepository placeholder, etc.)
│   └── localStorage/    # Local storage concrete implementations
├── services/            # Business logic (TransferService, MetricsService, ReportGeneratorService)
└── tests/               # Automated Vitest test suite
```
