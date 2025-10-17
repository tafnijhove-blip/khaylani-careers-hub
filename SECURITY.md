# Security Implementation - Khaylani Careers Hub

## Multitenant Architecture

### Overview
This application implements a strict multitenant architecture where each company (tenant) has complete data isolation from other companies. The system uses `company_id` as the tenant identifier.

### Key Security Features

#### 1. **Tenant Isolation at Database Level**
- **Security Definer Function**: `get_user_tenant_id(user_id)` - Returns the tenant ID for a user
- **Automatic Tenant Assignment**: Trigger `set_tenant_on_insert()` automatically assigns tenant on data creation
- **Performance Indexes**: Added for all tenant-related queries

#### 2. **Row Level Security (RLS) Policies**

All tables enforce tenant isolation through RLS policies:

##### Profiles
- Users can only view profiles from their own tenant
- Superadmins have access to all tenants

##### Bedrijven (Companies)
- Users view their own company + linked customer companies
- Tenant-based access control for all operations

##### Vacatures (Jobs)
- Only vacancies from user's tenant are visible
- Role-based INSERT/UPDATE/DELETE permissions
- Public view for open vacancies (status = 'open')

##### Kandidaten (Candidates)
- Access limited to candidates linked to tenant's vacancies
- Role-based operations (CEO/AccountManager can create, Recruiters read-only)

##### Bedrijf Relaties (Company Relations)
- View only relations where user's company is the staffing agency
- CEO/AccountManager can manage relations

##### Activity Log
- View only activities related to user's tenant or own actions
- Automatic tenant assignment on insert

#### 3. **Role-Based Access Control (RBAC)**

##### Available Roles
1. **Superadmin** - System administrator, access to all tenants
2. **CEO** - Company owner, full access within tenant
3. **Account Manager** - Can manage clients, vacancies, and candidates
4. **Recruiter** - Read-only access, can update status fields

##### Permission Matrix

| Feature | Superadmin | CEO | Account Manager | Recruiter |
|---------|------------|-----|-----------------|-----------|
| View All Tenants | ✅ | ❌ | ❌ | ❌ |
| Manage Users | ✅ | ✅ | ❌ | ❌ |
| View Companies | ✅ | ✅ | ✅ | ✅ |
| Create Vacancies | ✅ | ✅ | ✅ | ❌ |
| Edit Vacancies | ✅ | ✅ | ✅ | ❌ |
| View Vacancies | ✅ | ✅ | ✅ | ✅ |
| Update Candidate Status | ✅ | ✅ | ✅ | ✅ |
| Create Candidates | ✅ | ✅ | ✅ | ❌ |
| View Analytics | ✅ | ✅ | ✅ | ❌ |
| Manage Relations | ✅ | ✅ | ✅ | ❌ |

#### 4. **Frontend Security**

##### Protected Routes
All authenticated routes use the `ProtectedRoute` component which:
- Verifies user authentication
- Checks user roles
- Redirects unauthorized users
- Shows loading states during verification

##### Route Protection Examples
```tsx
// Superadmin only
<Route path="/superadmin" element={
  <ProtectedRoute requiredRoles={["superadmin"]}>
    <SuperAdminDashboard />
  </ProtectedRoute>
} />

// CEO and Account Manager only
<Route path="/analytics" element={
  <ProtectedRoute requiredRoles={["ceo", "accountmanager"]}>
    <Analytics />
  </ProtectedRoute>
} />

// All authenticated users
<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />
```

##### Conditional Rendering
UI components check permissions before rendering:
```tsx
const { canEditVacancies, canCreateVacancies } = usePermissions();

{canCreateVacancies && <CreateVacancyButton />}
{canEditVacancies && <EditButton />}
```

#### 5. **Authentication Flow**

1. User logs in via `/auth`
2. System fetches user's role and tenant ID
3. Automatic redirect based on role:
   - Superadmin → `/superadmin`
   - Other roles → `/bedrijf/{company_id}`
4. All subsequent requests include tenant context
5. Session maintained with automatic refresh

#### 6. **Data Access Patterns**

##### Tenant Context
All queries automatically filter by tenant:
```typescript
// Automatic tenant filtering via RLS
const { data } = await supabase
  .from('vacatures')
  .select('*')
  // No need to manually filter by tenant - RLS handles this
```

##### Superadmin Override
Superadmin role bypasses tenant restrictions in policies:
```sql
USING (
  bedrijf_id = get_user_tenant_id(auth.uid())
  OR has_role(auth.uid(), 'superadmin'::app_role)
)
```

## Security Best Practices

### ✅ Implemented
1. Server-side authentication and authorization
2. Row Level Security on all tables
3. Tenant isolation at database level
4. Role-based access control
5. Protected routes on frontend
6. Automatic tenant assignment
7. Session management with auto-refresh
8. Security definer functions to prevent recursive RLS

### ⚠️ Recommendations
1. Enable "Leaked Password Protection" in Supabase Auth settings
2. Implement rate limiting on API endpoints
3. Add audit logging for sensitive operations
4. Regular security audits
5. Keep dependencies updated

## Testing Tenant Isolation

To verify tenant isolation:

1. Create two test companies
2. Create users in each company
3. Login as each user
4. Verify that:
   - Users only see data from their tenant
   - Cross-tenant queries return empty results
   - Unauthorized access attempts are blocked

## Maintenance

### Adding New Tables
When adding new tables with tenant data:
1. Add `created_by` column (nullable uuid)
2. Add tenant reference (company_id or similar)
3. Enable RLS: `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`
4. Create tenant isolation policies
5. Add performance indexes
6. Update this documentation

### Modifying Roles
To add new roles or permissions:
1. Update the `app_role` enum
2. Update `usePermissions` hook
3. Update RLS policies
4. Update this documentation

## Support

For security concerns or questions, contact the development team.

**Last Updated**: 2025-01-17
**Version**: 1.0.0
