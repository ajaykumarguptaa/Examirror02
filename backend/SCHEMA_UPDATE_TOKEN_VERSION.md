# Schema Change Document: Add `token_version` to `centers` Table

- **Date:** October 22, 2026
- **Target Table:** `centers`
- **Feature Area:** Authentication & Center Account Management (Admin Password Reset / Status Suspension)
- **Status:** Applied & Verified

---

## 1. Issue Description

### Symptom
When an Administrator attempted to update a Center Head's password via the **"Update Center Password"** modal in the Admin Dashboard, the operation failed with the following database error:
```text
Error: Unknown column 'token_version' in 'field list'
```

### Root Cause
1. In `backend/src/services/admin.service.ts`:
   ```typescript
   // updateCenterPassword
   const [result]: any = await db.query(
     'UPDATE centers SET password_hash = ?, token_version = COALESCE(token_version, 1) + 1 WHERE id = ?', 
     [passwordHash, centerId]
   );
   ```
2. In `backend/src/routes/admin.routes.ts`:
   ```typescript
   // Center status update (suspend / reactivate)
   await db.query(
     'UPDATE centers SET status = ?, token_version = COALESCE(token_version, 1) + 1 WHERE id = ?', 
     [cleanStatus, req.params.id]
   );
   ```
3. In `backend/src/middleware/auth.middleware.ts`:
   ```typescript
   // Verifies token version matches JWT payload to invalidate old sessions immediately
   if (decoded.tokenVersion !== undefined && center.token_version !== undefined && decoded.tokenVersion !== center.token_version) {
     return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
   }
   ```
4. The migration files (`final_migration.sql` / `database_migration_complete.sql`) had `token_version` defined, but the column was missing from the live MySQL database table `centers`.

---

## 2. SQL Migration Executed

The following idempotent SQL statements were executed on the active database:

```sql
-- 1. Add the missing token_version column to centers table
ALTER TABLE centers ADD COLUMN IF NOT EXISTS token_version INT DEFAULT 1;

-- 2. Ensure all existing centers have an initial token_version of 1
UPDATE centers SET token_version = 1 WHERE token_version IS NULL;
```

---

## 3. Schema Definition

| Column Name | Data Type | Default | Nullable | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `token_version` | `INT` | `1` | `YES` | Incremented whenever a password is changed or an account is suspended/blocked. Instantly terminates old JWT sessions across all devices. |

---

## 4. How Session Invalidation Works

1. **Login (`auth.service.ts`):**
   - When a center logs in, the JWT token payload includes `{ id, role: 'center', tokenVersion: center.token_version || 1 }`.
2. **Every Request (`auth.middleware.ts`):**
   - The middleware queries the center's `token_version`. If the token's `tokenVersion` does not match the database value, the token is rejected (401 Unauthorized).
3. **Password Change or Suspension (`admin.service.ts` / `admin.routes.ts`):**
   - `token_version` is incremented (`COALESCE(token_version, 1) + 1`).
   - All existing active sessions for that center are immediately invalidated, forcing re-authentication with the new credentials.

---

## 5. Verification

Column verification confirmed in MySQL:
```
Field: token_version
Type: int
Default: 1
Null: YES
```
Password resets and status changes now execute without error.
