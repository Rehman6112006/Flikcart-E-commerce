# Admin Dashboard Implementation Plan

## Information Gathered:

### Existing Backend APIs (index.ts):
1. **Admin Auth**: `/api/admin/login` - JWT based auth
2. **Orders**: `/api/admin/all-orders`, `/api/admin/update-order-status`
3. **Riders**: `/api/admin/all-riders`, `/api/admin/cleanup-riders`
4. **Products**: `/api/products`, `/api/products/:id` (public + admin)
5. **Users**: `/api/auth/profile`, `/api/auth/register`

### Existing Frontend:
- **Admin Login**: `/admin/login/page.tsx` - Beautiful glassmorphism design
- **Admin Dashboard**: `/admin/page.tsx` - Orders & Riders management

### Task Requirements:
- Hide website navbar/footer when in admin dashboard
- Add: Product Management, User Management, Analytics, Settings, Profile
- Match existing website colors (#2563EB blue theme)
- TypeScript with no "any" types
- JWT protected routes

## Plan:

### Phase 1: Backend API Extensions
1. Add analytics endpoints (`/api/admin/analytics/*`)
2. Add product CRUD endpoints for admin
3. Add user management endpoints
4. Add settings endpoints
5. Add profile/password change endpoints

### Phase 2: Frontend - Admin Layout
1. Create `app/admin/layout.tsx` - Remove navbar/footer, add admin sidebar
2. Create sidebar navigation component

### Phase 3: Frontend - New Admin Pages
1. **Products**: `/admin/products/page.tsx` - List/Add/Edit/Delete
2. **Users**: `/admin/users/page.tsx` - List/View/Edit/Deactivate
3. **Analytics**: `/admin/analytics/page.tsx` - Charts & metrics
4. **Settings**: `/admin/settings/page.tsx` - Store settings
5. **Profile**: `/admin/profile/page.tsx` - Admin profile

### Phase 4: Update Existing Dashboard
1. Enhance `/admin/page.tsx` with better UI
2. Add proper order details modal

## Files to Create/Modify:

### Backend:
- `backend/src/index.ts` - Add new admin API endpoints

### Frontend:
- `frontend/src/app/admin/layout.tsx` - NEW (admin layout without nav/footer)
- `frontend/src/app/admin/page.tsx` - ENHANCE (dashboard overview)
- `frontend/src/app/admin/products/page.tsx` - NEW
- `frontend/src/app/admin/products/add/page.tsx` - NEW
- `frontend/src/app/admin/products/[id]/page.tsx` - NEW
- `frontend/src/app/admin/users/page.tsx` - NEW
- `frontend/src/app/admin/users/[id]/page.tsx` - NEW
- `frontend/src/app/admin/analytics/page.tsx` - NEW
- `frontend/src/app/admin/settings/page.tsx` - NEW
- `frontend/src/app/admin/profile/page.tsx` - NEW

## Dependencies to Add:
- recharts (for analytics charts)
- jspdf (for PDF export)
- react-csv (for CSV export)

## Follow-up Steps:
1. Install dependencies
2. Create backend API endpoints
3. Create admin layout with sidebar
4. Build all admin pages
5. Test functionality

