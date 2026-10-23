# Schema Change Document: Add Missing Columns to `franchise_applications` Table

- **Date:** October 22, 2026
- **Target Table:** `franchise_applications`
- **Feature Area:** Certificate Governance & Document Demanding Workflow (`demandCenterCertificateDocs`)
- **Status:** Applied & Audited across all 45 database tables

---

## 1. Issue Description

### Symptom
When Super Admin attempted to request additional documents from a center using the **"Demand Required Documents"** modal, the request failed with the following database error:
```text
Error: Unknown column 'center_id' in 'field list'
```

### Root Cause
In `backend/src/services/admin.service.ts`:
```typescript
demandCenterCertificateDocs: async (
  centerIdOrCode: number | string,
  notes: string,
  demandedDocs: string[] = []
) => {
  let center: any = null;

  // Look up franchise application first:
  const [appRows]: any = await db.query(
    'SELECT id, center_id, center_code, center_name, email, phone FROM franchise_applications WHERE id = ?',
    [centerIdOrCode]
  );
  ...
```
The query explicitly requested `center_id` (and `center_code`) from `franchise_applications`. While these columns were defined in `final_migration.sql`, they had not been migrated to the active MySQL table `franchise_applications`.

---

## 2. Complete Audit & Remediation

A full audit of all 45 tables in the MySQL database against `final_migration.sql` identified that `franchise_applications` was missing 6 schema columns:

1. `center_id` (INT)
2. `center_code` (VARCHAR(50))
3. `certificate_demanded_docs` (TEXT)
4. `certificate_number` (VARCHAR(100))
5. `login_id` (VARCHAR(100))
6. `proposed_password` (VARCHAR(255))

---

## 3. SQL Migration Applied

The following changes were executed and verified on the live database:

```sql
ALTER TABLE franchise_applications ADD COLUMN certificate_demanded_docs TEXT NULL;
ALTER TABLE franchise_applications ADD COLUMN center_id INT DEFAULT NULL;
ALTER TABLE franchise_applications ADD COLUMN center_code VARCHAR(50) DEFAULT NULL;
ALTER TABLE franchise_applications ADD COLUMN certificate_number VARCHAR(100) DEFAULT NULL;
ALTER TABLE franchise_applications ADD COLUMN login_id VARCHAR(100) DEFAULT NULL;
ALTER TABLE franchise_applications ADD COLUMN proposed_password VARCHAR(255) DEFAULT NULL;
```

---

## 4. Column Schema Specification

| Column | Type | Default | Purpose |
| :--- | :--- | :--- | :--- |
| `center_id` | `INT` | `NULL` | Foreign key reference to active `centers.id` when application is approved. |
| `center_code` | `VARCHAR(50)` | `NULL` | Assigned center identification code (e.g., `EXAMc2026-103`). |
| `certificate_demanded_docs` | `TEXT` | `NULL` | JSON list of required missing documents flagged by Super Admin. |
| `certificate_number` | `VARCHAR(100)` | `NULL` | Official affiliation certificate registration number. |
| `login_id` | `VARCHAR(100)` | `NULL` | Center head login username. |
| `proposed_password` | `VARCHAR(255)` | `NULL` | Initial onboarding password reference. |

---

## 5. Verification

1. A full schema audit was executed across all 45 tables against `final_migration.sql`. Result:
   ```json
   Audit results: {} (0 missing columns remaining across the entire database)
   ```
2. The document demand request and notification flow can now be submitted directly from the modal.
