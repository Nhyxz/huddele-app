# NHS Production Readiness & Information Governance Assessment

> **Classification**: OFFICIAL-SENSITIVE (When in Production)  
> **Document Purpose**: Architecture and Security Roadmap for transitioning the ED Huddle and Action Management System from a local browser demonstration prototype into an approved, live clinical operational tool.

---

## 1. Executive Statement on Prototype Storage

> ⚠️ **CRITICAL GOVERNANCE STATEMENT**:  
> **Browser LocalStorage is strictly NOT suitable for production use or real patient data.**  
>
> In this prototype:
> 1. All records are fictitious demonstration records.
> 2. Data is stored unencrypted in the user's browser local storage.
> 3. No connection exists to live NHS Trust EHRs (e.g., Cerner, Epic, System C) or ambulance CAD systems.
>
> **Under no circumstances should real patient identifiable information (NHS numbers, patient full names, dates of birth, or clinical diagnoses) be entered into this prototype.**

---

## 2. Production Transition Architecture Matrix

| Domain | Prototype Implementation | Production Requirement |
| :--- | :--- | :--- |
| **Authentication** | UI-based demonstration role switcher | Microsoft Entra ID (Azure AD) SSO with NHS CIS2 / Smartcard integration |
| **Authorization** | Client-side role simulation | Server-side Role-Based Access Control (RBAC) with token validation |
| **Data Persistence** | Browser `localStorage` | Microsoft Dataverse, Azure SQL Managed Instance, or PostgreSQL |
| **API Layer** | Direct repository interface to LocalStorage | Secure RESTful API (ASP.NET Core or Node.js) with OpenAPI 3.0 specs |
| **Audit Trails** | Browser array of event logs | Immutable, tamper-evident audit logging (Azure Monitor / Log Analytics) |
| **Data Retention** | Manual in-browser reset / clear | Automated retention schedules complying with NHS Records Management Code |
| **Network & Transport** | Local loopback (`localhost`) | TLS 1.3 enforced, HSTS, NHS Health and Social Care Network (HSCN) routing |
| **CSP & Headers** | Vite default | Strict Content Security Policy, OWASP Top 10 hardening |
| **Monitoring** | Browser console logging | Real-time Application Insights / Sentry with clinical alert routing |

---

## 3. Detailed Technical Requirements for Production

### A. Authentication & Identity Management (Microsoft Entra ID & NHS CIS2)
* **Identity Provider**: Integrate with Microsoft Entra ID (formerly Azure Active Directory) using MSAL.js on the frontend and OAuth 2.0 / OpenID Connect on the backend.
* **NHS Care Identity Service 2 (CIS2)**: Where physical or virtual smartcards are required in clinical areas, authenticate via the NHS England CIS2 authentication broker.
* **Multi-Factor Authentication (MFA)**: Mandatory for any access outside the physical hospital Trust intranet.
* **Zero Trust Policy**: Tokens must carry a short lifespan (15 minutes) with rotating refresh tokens and automatic inactivity lockouts after 5 minutes of frontline idle time.

### B. Role-Based Access Control (RBAC)
Server-side claims must strictly enforce permissions:
* `Huddle.Lead`: Create, edit, complete huddles, and transfer unresolved actions.
* `Huddle.Contributor`: Add and update patient actions assigned to their team.
* `Operational.Manager`: View hospital-wide department snapshots, trends, and generate overnight reports.
* `Read.Only`: Clinical staff viewing bed status without modification privileges.
* `Trust.Admin`: System configuration, bed area mapping, and audit inspection.

### C. Server-Side API & Database Integration
The interface-based repository layer designed in this prototype (`IHuddleRepository`, `IActionRepository`, `ISnapshotRepository`, `IReportRepository`) was explicitly structured to enable drop-in replacement by production API clients:

```typescript
// Replace: LocalStorageActionRepository
// With:    ApiActionRepository (calling secure NHS Trust endpoints)
export class ApiActionRepository implements IActionRepository {
  constructor(private httpClient: TrustAuthenticatedClient) {}

  async getByHuddleId(huddleId: string): Promise<OperationalAction[]> {
    return this.httpClient.get(`/api/v1/huddles/${huddleId}/actions`);
  }
  // ...
}
```

* **Recommended Dataverse / SQL Schema**: Relational schema with foreign keys linking `Huddles`, `OperationalActions`, `DepartmentSnapshots`, and `AuditLogs`.
* **FHIR Compatibility**: For automated patient roster synchronization, build adapters against HL7 FHIR `Encounter`, `Task`, and `Flag` resources from the Trust's Electronic Patient Record (EPR).

### D. Audit Logging & Non-Repudiation
Under the NHS Data Security and Protection Toolkit (DSPT):
* Every change to an action (status change, transfer, deletion, modification) must record:
  * User ID (Entra Object ID & Smartcard UUID)
  * Timestamp in UTC (ISO 8601)
  * Client IP and device identifier
  * Previous state snapshot and new state snapshot
  * Justification reason (mandatory when updating completed huddles)
* Audit records must be immutable and streamed to a central Security Information and Event Management (SIEM) system.

### E. Data Retention & Archival
* Huddle action records and department snapshots must comply with the **Records Management Code of Practice 2021** (typically 8 years for operational clinical logs).
* Automated lifecycle management policies should move records older than 90 days into cold storage while keeping them accessible for clinical audit or legal inquiry.

### F. Content Security Policy (CSP) & Web Hardening
Production reverse proxies (e.g. Azure Application Gateway or NGINX) must inject:
```http
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://api.trust.nhs.uk; font-src 'self'; frame-ancestors 'none';
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), camera=(), microphone=()
```

### G. Clinical Safety Assurance (DCB0129 / DCB0160)
Before deployment into live hospital operations, the Clinical Safety Officer (CSO) must sign off on:
1. **Hazard Log**: Evaluating risks such as dropped actions during shift handovers. (The *Transfer Unactioned* workflow directly mitigates this hazard).
2. **Clinical Safety Case Report (CSCR)**: Formal evidence documenting validation checks, duplicate transfer prevention, and audit traceability.
3. **Data Protection Impact Assessment (DPIA)**: Approved by the Trust Caldicott Guardian and Information Governance Lead.
